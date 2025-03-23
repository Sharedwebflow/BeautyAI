import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeFacialFeatures } from "./lib/gemini";
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

  app.post("/api/analyze", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        res.status(400).json({ message: "Image is required" });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ message: "Gemini API key is not configured" });
        return;
      }

      // Log the image size for debugging
      console.log(`Processing image of size: ${image.length} bytes`);

      // Validate base64 format
      if (!/^[A-Za-z0-9+/=]+$/.test(image)) {
        res.status(400).json({ message: "Invalid image format. Please provide a valid base64 encoded image." });
        return;
      }

      try {
        const analysis = await analyzeFacialFeatures(image);
        console.log('Analysis completed successfully');

        const validatedAnalysis = insertAnalysisSchema.parse({
          userId: req.user?.id || 1,
          imageUrl: `data:image/jpeg;base64,${image}`,
          features: analysis.features,
          skinType: analysis.skinType,
          concerns: analysis.concerns,
          recommendations: analysis.recommendations
        });

        const savedAnalysis = await storage.createAnalysis(validatedAnalysis);
        res.json(savedAnalysis);
      } catch (analysisError) {
        console.error('Analysis error:', analysisError);
        res.status(500).json({ 
          message: "Failed to analyze image. Please make sure the image contains a clear face and try again.",
          details: analysisError instanceof Error ? analysisError.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ 
        message: "An unexpected error occurred while processing your request",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const analysis = await storage.getAnalysis(Number(req.params.id));
      if (!analysis) {
        res.status(404).json({ message: "Analysis not found" });
        return;
      }
      res.json(analysis);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
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

  const httpServer = createServer(app);
  return httpServer;
}