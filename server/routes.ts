import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeFacialFeatures } from "./lib/openai";
import { insertAnalysisSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.json(product);
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        res.status(400).json({ message: "Image is required" });
        return;
      }

      const analysis = await analyzeFacialFeatures(image);
      const validatedAnalysis = insertAnalysisSchema.parse({
        imageUrl: `data:image/jpeg;base64,${image}`,
        features: analysis.features,
        recommendations: analysis.recommendations
      });

      const savedAnalysis = await storage.createAnalysis(validatedAnalysis);
      res.json(savedAnalysis);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
