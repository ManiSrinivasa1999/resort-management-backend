import express from "express";
import cors from "cors";
import helmet from "helmet";
import { loadConfig } from "./config/config";
import { getPrismaClient } from "./config/prismaConfig";
import authRoutes from "./routes/authRoutes";


const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/auth", authRoutes);

const startServer = async () => {
  const config = await loadConfig();

  app.get("/",async  (req, res) => {
    try {
      const prisma = await getPrismaClient()
      const users = await prisma.user.findMany()
      res.send({message: "Resort booking API is running...", users})
    } catch (error) {
      res.status(500).json({error: 'Database connection failed'})
    }
  });

  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
