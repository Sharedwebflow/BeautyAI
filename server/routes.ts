import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// We'll keep both imports ready, uncomment the one you want to use
import { analyzeFacialFeatures as analyzeWithGemini } from "./lib/gemini";
// import { analyzeFacialFeatures as analyzeWithOpenAI } from "./lib/openai";
import { insertAnalysisSchema } from "@shared/schema";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes and middleware
  setupAuth(app);

  // Product routes
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

  app.get("/api/analysis/:id/recommendations", async (req, res) => {
    try {
      const analysis = await storage.getAnalysis(Number(req.params.id));
      if (!analysis) {
        res.status(404).json({ message: "Analysis not found" });
        return;
      }

      const recommendedProducts = await storage.getRecommendedProducts(analysis);
      res.json(recommendedProducts);
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        res.status(400).json({ message: "Image is required" });
        return;
      }

      // Use Gemini by default, switch to OpenAI if preferred
      const analysis = await analyzeWithGemini(image);
      const validatedAnalysis = insertAnalysisSchema.parse({
        userId: req.user?.id || 1, // Use default user ID if not logged in
        imageUrl: `data:image/jpeg;base64,${image}`,
        features: analysis.features,
        skinType: analysis.skinType,
        concerns: analysis.concerns,
        recommendations: analysis.recommendations
      });

      const savedAnalysis = await storage.createAnalysis(validatedAnalysis);
      res.json(savedAnalysis);
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}