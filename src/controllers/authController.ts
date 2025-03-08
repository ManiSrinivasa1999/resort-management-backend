import AWS from "aws-sdk";
import { Request, Response } from "express";
import { loadConfig } from "../config/awsConfig";
import crypto from "crypto";

const cognito = new AWS.CognitoIdentityServiceProvider();

function generateSecretHash(username: string, clientId: string, clientSecret: string) {
  const message = username + clientId;
  return crypto.createHmac("sha256", clientSecret).update(message).digest("base64");
}

/**
 * Registers a new user in AWS Cognito
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, phoneNumber, role } = req.body;

    if (!email || !password || !phoneNumber || !role) {
      res.status(400).json({ error: "Email, Phone, Password, and Role are required." });
      return;
    }

    const config = await loadConfig();

    const params: AWS.CognitoIdentityServiceProvider.AdminCreateUserRequest = {
      UserPoolId: config.USER_POOL_ID,
      Username: email,
      TemporaryPassword: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "phone_number", Value: phoneNumber },
        { Name: "custom:role", Value: role },
      ],
      MessageAction: "SUPPRESS",
    };

    await cognito.adminCreateUser(params).promise();

    await cognito.adminSetUserPassword({
      UserPoolId: config.USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    }).promise();

    res.json({ message: "User registered successfully. Please login." });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Registration failed" });
  }
};


/**
 * Logs in a user using either email or phone number
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: "Email/Phone and password are required." });
      return;
    }

    const config = await loadConfig();
    
    // Generate the SECRET_HASH
    const secretHash = generateSecretHash(identifier, config.CLIENT_ID, config.CLIENT_SECRET);
    
    const params: AWS.CognitoIdentityServiceProvider.InitiateAuthRequest = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: config.CLIENT_ID,
      AuthParameters: {
        USERNAME: identifier,
        PASSWORD: password,
        SECRET_HASH: secretHash, // 🔹 Required when client secret is enabled
      },
    };

    const authResult = await cognito.initiateAuth(params).promise();

    res.json({
      token: authResult.AuthenticationResult?.IdToken,
      refreshToken: authResult.AuthenticationResult?.RefreshToken,
      accessToken: authResult.AuthenticationResult?.AccessToken,
    });

  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(401).json({ error: error instanceof Error ? error.message : "Login failed" });
  }
};