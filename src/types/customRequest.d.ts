import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    "cognito:groups"?: string[];
  };
}
