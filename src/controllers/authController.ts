import AWS from "aws-sdk"
import { Request, Response } from "express"
import { loadConfig } from "../config/awsConfig"
import { getPrismaClient } from "../config/prismaConfig"
import crypto from "crypto"

const cognito = new AWS.CognitoIdentityServiceProvider()

function generateSecretHash(username: string, clientId: string, clientSecret: string) {
  const message = username + clientId
  return crypto.createHmac("sha256", clientSecret).update(message).digest("base64")
}

/**
 * Registers a new user (Resort Owner or Customer)
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, phone, role } = req.body
    if (!email || !password || !phone || !role) {
      res.status(400).json({ error: "All fields are required." })
      return
    }

    const config = await loadConfig()
    const params: AWS.CognitoIdentityServiceProvider.AdminCreateUserRequest = {
      UserPoolId: config.USER_POOL_ID,
      Username: email,
      TemporaryPassword: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "phone_number", Value: phone },
        { Name: "custom:role", Value: role },
      ],
      MessageAction: "SUPPRESS",
    }

    await cognito.adminCreateUser(params).promise()
    await cognito
      .adminSetUserPassword({
        UserPoolId: config.USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true,
      })
      .promise()
    const prisma = await getPrismaClient()

    // Store user in database
    const user = await prisma.user.create({
      data: { email, phone, role },
    })

    res.json({ message: "User registered successfully.", user })
  } catch (error) {
    console.error("Error in registerUser:", error)
    res.status(500).json({ error: error instanceof Error ? error.message : "Registration failed" })
  }
}

/**
 * Logs in a user and returns JWT + role
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body
    if (!identifier || !password) {
      res.status(400).json({ error: "Email/Phone and password are required." })
      return
    }

    const config = await loadConfig()
    const secretHash = generateSecretHash(identifier, config.CLIENT_ID, config.CLIENT_SECRET)

    const params: AWS.CognitoIdentityServiceProvider.InitiateAuthRequest = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: config.CLIENT_ID,
      AuthParameters: {
        USERNAME: identifier,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    }

    const authResult = await cognito.initiateAuth(params).promise()
    const idToken = authResult.AuthenticationResult?.IdToken
    if (!idToken) {
      res.status(401).json({ error: "Authentication failed." })
      return
    }

    const decoded = JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString())
    const email = decoded.email
    const prisma = await getPrismaClient()
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      res.status(404).json({ error: "User not found in database. Please register." })
      return
    }

    res.json({ token: idToken, user })
  } catch (error) {
    console.error("Error in loginUser:", error)
    res.status(401).json({ error: "Login failed" })
  }
}
