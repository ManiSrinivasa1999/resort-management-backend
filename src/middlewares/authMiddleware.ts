import { Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { AuthenticatedRequest } from "../types/customRequest"

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.split(" ")[1]

    if (!token) {
      res.status(401).json({ error: "Access denied. No token provided." })
      return
    }

    const decoded = jwt.decode(token) as {
      id: string
      email: string
      role: string
      "cognito:groups"?: string[]
    }

    if (!decoded || !decoded.id || !decoded.email || !decoded.role) {
      res.status(400).json({ error: "Invalid token." })
      return
    }

    req.user = decoded
    next() // ✅ Ensures the next middleware runs
  } catch (error) {
    console.error("Authentication error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
