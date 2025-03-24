import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeFacialFeatures } from "./lib/ai";
import { insertAnalysisSchema } from "@shared/schema";
import { setupAuth } from "./auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

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
      console.log('Received analyze request');
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({ message: "Please upload an image to analyze" });
      }

      // Validate base64 format
      if (!/^[A-Za-z0-9+/=]+$/.test(image)) {
        return res.status(400).json({ 
          message: "Invalid image format. Please ensure you're uploading a valid image." 
        });
      }

      try {
        console.log('Starting facial analysis...');
        const analysis = await analyzeFacialFeatures(image);
        console.log('Analysis completed successfully');

        try {
          const validatedAnalysis = insertAnalysisSchema.parse({
            userId: req.user?.id || 1,
            imageUrl: `data:image/jpeg;base64,${image}`,
            ...analysis
          });

          console.log('Saving analysis results...');
          const savedAnalysis = await storage.createAnalysis(validatedAnalysis);
          return res.json(savedAnalysis);

        } catch (validationError) {
          console.error('Validation error:', validationError);
          if (validationError instanceof z.ZodError) {
            return res.status(400).json({
              message: "Invalid analysis data format",
              details: validationError.errors
            });
          }
          throw validationError;
        }

      } catch (analysisError) {
        console.error('Analysis error:', analysisError);
        return res.status(500).json({ 
          message: analysisError instanceof Error ? analysisError.message : "Analysis failed. Please try again.",
          code: 500
        });
      }
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ 
        message: "An unexpected error occurred. Please try again.",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const analysisId = Number(req.params.id);
      if (isNaN(analysisId)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }

      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      return res.json(analysis);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      return res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  app.get("/api/analysis/:id/recommendations", async (req, res) => {
    try {
      const analysis = await storage.getAnalysis(Number(req.params.id));
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      const recommendedProducts = await storage.getRecommendedProducts(analysis);
      return res.json(recommendedProducts);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return res.status(500).json({ 
        message: "Failed to fetch product recommendations",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}