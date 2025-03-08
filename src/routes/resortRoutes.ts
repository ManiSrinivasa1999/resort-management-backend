import express, { Request, Response } from "express"
import { AuthenticatedRequest } from "../types/customRequest"
import { authenticateUser } from "../middlewares/authMiddleware"
import { getPrismaClient } from "../config/prismaConfig"

const router = express.Router()

// ✅ Add Resort (Only Resort Owners)
router.post(
  "/add-resort",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const prisma = await getPrismaClient()
    try {
      if (req.user?.role !== "RESORT_CLIENT") {
        res.status(403).json({ error: "Permission denied" })
        return
      }

      const { name, description, location, price, amenities, images } = req.body

      const resort = await prisma.resort.create({
        data: {
          name,
          description,
          location,
          price,
          amenities,
          images,
          ownerId: req.user.id,
        },
      })

      res.json({ message: "Resort added successfully", resort })
    } catch (error) {
      console.error("Error adding resort:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
)

// ✅ Update Resort (Only Owner)
router.put(
  "/update-resort/:id",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const { name, description, location, price, amenities, images } = req.body
      const prisma = await getPrismaClient()

      const resort = await prisma.resort.findUnique({ where: { id } })

      if (!resort) {
        res.status(404).json({ error: "Resort not found" })
        return
      }

      // ❌ Ensure only the owner can update
      if (resort.ownerId !== req.user?.id) {
        res.status(403).json({ error: "Permission denied" })
        return
      }

      const updatedResort = await prisma.resort.update({
        where: { id },
        data: { name, description, location, price, amenities, images },
      })

      res.json({ message: "Resort updated successfully", updatedResort })
    } catch (error) {
      console.error("Error updating resort:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
)

// ✅ Delete Resort (Only Owner)
router.delete(
  "/delete-resort/:id",
  authenticateUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const prisma = await getPrismaClient()

      const resort = await prisma.resort.findUnique({ where: { id } })

      if (!resort) {
        res.status(404).json({ error: "Resort not found" })
        return
      }

      // ❌ Ensure only the owner can delete
      if (resort.ownerId !== req.user?.id) {
        res.status(403).json({ error: "Permission denied" })
        return
      }

      await prisma.resort.delete({ where: { id } })

      res.json({ message: "Resort deleted successfully" })
    } catch (error) {
      console.error("Error deleting resort:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
)

export default router
