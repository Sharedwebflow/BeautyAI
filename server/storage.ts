import { type Product, type Analysis, type InsertProduct, type InsertAnalysis, sampleProducts } from "@shared/schema";

export interface IStorage {
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getRecommendedProducts(analysis: Analysis): Promise<Product[]>;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private analyses: Map<number, Analysis>;
  private currentAnalysisId: number;

  constructor() {
    this.products = new Map();
    this.analyses = new Map();
    this.currentAnalysisId = 1;

    // Initialize with sample products
    sampleProducts.forEach((product, index) => {
      this.products.set(index + 1, { ...product, id: index + 1, matchScore: null });
    });
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const id = this.currentAnalysisId++;
    const newAnalysis = { ...analysis, id };
    this.analyses.set(id, newAnalysis);
    return newAnalysis;
  }

  async getRecommendedProducts(analysis: Analysis): Promise<Product[]> {
    const products = Array.from(this.products.values());

    return products.map(product => {
      let score = 0;

      // Match ingredients with recommendations
      analysis.recommendations.forEach(rec => {
        rec.ingredients.forEach(ingredient => {
          if (product.ingredients.some(i => i.toLowerCase().includes(ingredient.toLowerCase()))) {
            score += 2;
          }
        });

        // Match product category
        if (product.category.toLowerCase() === rec.category.toLowerCase()) {
          score += 3;
        }
      });

      // Match skin concerns with benefits
      if (analysis.concerns) {
        analysis.concerns.forEach(concern => {
          product.benefits.forEach(benefit => {
            if (benefit.toLowerCase().includes(concern.toLowerCase())) {
              score += 2;
            }
          });
        });
      }

      return {
        ...product,
        matchScore: score
      };
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 4); // Return top 4 matches
  }
}

export const storage = new MemStorage();