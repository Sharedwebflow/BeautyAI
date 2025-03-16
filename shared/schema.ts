import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  price: integer("price").notNull(),
  benefits: text("benefits").array().notNull(),
  ingredients: text("ingredients").array().notNull(),
  suitableFor: text("suitable_for").array().notNull(),
  matchScore: integer("match_score"),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  features: jsonb("features").notNull(),
  skinType: text("skin_type").notNull(),
  concerns: text("concerns").array().notNull(),
  recommendations: jsonb("recommendations").notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertAnalysisSchema = createInsertSchema(analyses).omit({ id: true });

export type Product = typeof products.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;

export const sampleProducts: InsertProduct[] = [
  {
    name: "Radiance Face Cream",
    description: "Hydrating moisturizer for all skin types",
    category: "moisturizer",
    imageUrl: "https://images.unsplash.com/photo-1612817288484-6f916006741a",
    price: 2999,
    benefits: ["Hydration", "Brightening", "Anti-aging"],
    ingredients: ["Hyaluronic Acid", "Vitamin C", "Peptides"],
    suitableFor: ["Dry Skin", "Normal Skin", "Combination Skin"]
  },
  {
    name: "Natural Glow Serum",
    description: "Vitamin C enriched brightening serum",
    category: "serum",
    imageUrl: "https://images.unsplash.com/photo-1515688594390-b649af70d282",
    price: 3499,
    benefits: ["Brightening", "Even Tone", "Antioxidant Protection"],
    ingredients: ["Vitamin C", "Niacinamide", "Green Tea Extract"],
    suitableFor: ["All Skin Types", "Dull Skin", "Hyperpigmentation"]
  },
  {
    name: "Gentle Cleansing Foam",
    description: "pH balanced facial cleanser",
    category: "cleanser",
    imageUrl: "https://images.unsplash.com/photo-1608068811588-3a67006b7489",
    price: 1999,
    benefits: ["Gentle Cleansing", "pH Balanced", "Non-drying"],
    ingredients: ["Glycerin", "Chamomile", "Aloe Vera"],
    suitableFor: ["Sensitive Skin", "All Skin Types"]
  },
  {
    name: "Youth Restore Night Cream",
    description: "Anti-aging night treatment",
    category: "moisturizer",
    imageUrl: "https://images.unsplash.com/photo-1586220742613-b731f66f7743",
    price: 4999,
    benefits: ["Anti-aging", "Skin Repair", "Moisture Barrier Support"],
    ingredients: ["Retinol", "Ceramides", "Peptides"],
    suitableFor: ["Mature Skin", "Fine Lines", "Dry Skin"]
  }
];