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
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  features: jsonb("features").notNull(),
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
    price: 2999
  },
  {
    name: "Natural Glow Serum",
    description: "Vitamin C enriched brightening serum",
    category: "serum",
    imageUrl: "https://images.unsplash.com/photo-1515688594390-b649af70d282",
    price: 3499
  },
  {
    name: "Gentle Cleansing Foam",
    description: "pH balanced facial cleanser",
    category: "cleanser",
    imageUrl: "https://images.unsplash.com/photo-1608068811588-3a67006b7489",
    price: 1999
  },
  {
    name: "Youth Restore Night Cream",
    description: "Anti-aging night treatment",
    category: "moisturizer",
    imageUrl: "https://images.unsplash.com/photo-1586220742613-b731f66f7743",
    price: 4999
  }
];
