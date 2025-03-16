import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface FacialAnalysis {
  skinType: string;
  concerns: string[];
  features: {
    eyes: string;
    lips: string;
    cheeks: string;
    jawline: string;
    forehead: string;
    noseShape: string;
    skinTexture: string;
    symmetry: string;
  };
  recommendations: {
    category: string;
    productType: string;
    reason: string;
    priority: number;
    ingredients: string[];
  }[];
}

export async function analyzeFacialFeatures(base64Image: string): Promise<FacialAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const prompt = `Analyze this person's facial features and beauty characteristics in detail. 
    Provide a comprehensive analysis including:
    - Skin type and concerns
    - Detailed feature analysis (eyes, lips, cheeks, jawline, forehead, nose shape, skin texture, facial symmetry)
    - Product recommendations with specific ingredients
    
    Format the response as a JSON object with this structure:
    {
      "skinType": "...",
      "concerns": ["...", "..."],
      "features": {
        "eyes": "...",
        "lips": "...",
        "cheeks": "...",
        "jawline": "...",
        "forehead": "...",
        "noseShape": "...",
        "skinTexture": "...",
        "symmetry": "..."
      },
      "recommendations": [
        {
          "category": "...",
          "productType": "...",
          "reason": "...",
          "priority": number,
          "ingredients": ["...", "..."]
        }
      ]
    }`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from response");
    }
    
    const analysisData = JSON.parse(jsonMatch[0]);
    return analysisData as FacialAnalysis;
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to analyze facial features: ${err.message}`);
  }
}
