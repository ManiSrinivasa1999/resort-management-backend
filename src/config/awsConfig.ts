import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const ssm = new AWS.SSM({ region: process.env.AWS_REGION || "ap-south-1" });

export const loadConfig = async () => {
  const params = await ssm
    .getParameters({
      Names: ["/app/USER_POOL_ID", "/app/CLIENT_ID", "/app/CLIENT_SECRET"],
      WithDecryption: true,
    })
    .promise();

  return {
    USER_POOL_ID: params.Parameters?.find((p) => p.Name === "/app/USER_POOL_ID")?.Value || "",
    CLIENT_ID: params.Parameters?.find((p) => p.Name === "/app/CLIENT_ID")?.Value || "",
    CLIENT_SECRET: params.Parameters?.find((p) => p.Name === "/app/CLIENT_SECRET")?.Value || "",
  };
};
