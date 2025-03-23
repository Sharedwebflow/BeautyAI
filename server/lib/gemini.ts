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
    console.log('Initializing Gemini model');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `As a professional beauty advisor and dermatologist, analyze this person's facial features and provide detailed recommendations. Focus on:

1. Skin type and texture
2. Facial feature analysis
3. Product recommendations with specific ingredients

Provide the response in this exact JSON format:
{
  "skinType": "combination/oily/dry/etc",
  "concerns": ["concern1", "concern2"],
  "features": {
    "eyes": "description",
    "lips": "description",
    "cheeks": "description",
    "jawline": "description",
    "forehead": "description",
    "noseShape": "description",
    "skinTexture": "description",
    "symmetry": "description"
  },
  "recommendations": [
    {
      "category": "category name",
      "productType": "specific product type",
      "reason": "why this product",
      "priority": 1-5 number,
      "ingredients": ["ingredient1", "ingredient2"]
    }
  ]
}`;

    console.log('Sending request to Gemini API');
    const result = await model.generateContent({
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }]
    });

    const response = await result.response;
    const text = response.text();
    console.log('Received response from Gemini API');

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Gemini response");
    }

    try {
      const analysisData = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed analysis data');
      return analysisData as FacialAnalysis;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      throw new Error("Invalid response format from Gemini API");
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to analyze facial features: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}