import express, { Response } from "express";
import { AuthenticatedRequest } from "../types/customRequest";
import { authenticateUser } from "../middlewares/authMiddleware";

const router = express.Router();

router.post(
  "/add-resort",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (req.user?.["cognito:groups"]?.includes("resort-client")) {
        res.json({ message: "Resort added successfully" });
        return;
      }
      res.status(403).json({ error: "Permission denied" });
    } catch (error) {
      console.error("Error adding resort:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
