import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeFacialFeatures } from "./lib/openai";
import { insertAnalysisSchema, insertUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/user", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        res.status(400).json({ message: "User already exists" });
        return;
      }

      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/user/me", async (req, res) => {
    try {
      // TODO: Replace with actual user ID from session
      const user = await storage.getUser(1);
      if (!user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }
      res.json(user);
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/user/analyses", async (req, res) => {
    try {
      // TODO: Replace with actual user ID from session
      const analyses = await storage.getUserAnalyses(1);
      res.json(analyses);
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ message: err.message });
    }
  });

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

      const analysis = await analyzeFacialFeatures(image);
      const validatedAnalysis = insertAnalysisSchema.parse({
        userId: 1, // TODO: Replace with actual user ID from session
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