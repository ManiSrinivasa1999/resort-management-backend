import { Request } from "express"

export interface AuthenticatedRequest extends Request {
  user?: {
    "cognito:groups"?: string[]
    id: string
    email: string
    role: string
  }
}
