import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"
import dotenv from "dotenv"

dotenv.config() // Load from .env file

const ssm = new SSMClient({ region: "ap-south-1" })

async function getSSMParameter(name: string): Promise<string> {
  try {
    const command = new GetParameterCommand({ Name: name, WithDecryption: true })
    const response = await ssm.send(command)
    if (!response.Parameter?.Value) throw new Error(`Missing value for ${name}`)
    return response.Parameter.Value
  } catch (error) {
    console.error(`Error fetching ${name}:`, error)
    throw error
  }
}

export async function loadConfig() {
  return {
    PORT: process.env.PORT || 5000,
    DB_HOST: process.env.DB_HOST || (await getSSMParameter("/app/DB_HOST")),
    DB_USER: process.env.DB_USER || (await getSSMParameter("/app/DB_USER")),
    DB_PASSWORD: process.env.DB_PASSWORD || (await getSSMParameter("/app/DB_PASSWORD")),
    DB_NAME: process.env.DB_NAME || (await getSSMParameter("/app/DB_NAME")),
    DB_PORT: process.env.DB_PORT || (await getSSMParameter("/app/DB_PORT")),
    USER_POOL_ID: process.env.USER_POOL_ID || (await getSSMParameter("/app/USER_POOL_ID")),
    CLIENT_ID: process.env.CLIENT_ID || (await getSSMParameter("/app/CLIENT_ID")),
    CLIENT_SECRET: process.env.CLIENT_SECRET || (await getSSMParameter("/app/CLIENT_SECRET")),
  }
}
