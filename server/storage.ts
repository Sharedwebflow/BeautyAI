import { type Product, type Analysis, type InsertProduct, type InsertAnalysis, sampleProducts } from "@shared/schema";

export interface IStorage {
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
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
      this.products.set(index + 1, { ...product, id: index + 1 });
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
}

export const storage = new MemStorage();
