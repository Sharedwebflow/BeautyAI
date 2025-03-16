import { type Product, type Analysis, type User, type InsertProduct, type InsertAnalysis, type InsertUser, sampleProducts } from "@shared/schema";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;

  // Analysis operations
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getUserAnalyses(userId: number): Promise<Analysis[]>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getRecommendedProducts(analysis: Analysis): Promise<Product[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private analyses: Map<number, Analysis>;
  private currentUserId: number;
  private currentAnalysisId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.analyses = new Map();
    this.currentUserId = 1;
    this.currentAnalysisId = 1;

    // Initialize with sample products
    sampleProducts.forEach((product, index) => {
      this.products.set(index + 1, { ...product, id: index + 1, matchScore: null });
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser = {
      ...user,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
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

  async getUserAnalyses(userId: number): Promise<Analysis[]> {
    return Array.from(this.analyses.values())
      .filter(analysis => analysis.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const id = this.currentAnalysisId++;
    const newAnalysis = {
      ...analysis,
      id,
      createdAt: new Date(),
    };
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