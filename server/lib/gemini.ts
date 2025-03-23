import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface FacialAnalysis {
  skinType: string;
  concerns: string[];
  features: {
    moisture: string;
    acne: string;
    darkSpots: string;
    pores: string;
    wrinkles: string;
    texture: string;
    redness: string;
    elasticity: string;
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
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // The prompt that specifies the format we want
    const prompt = `Analyze this facial image and provide a skin assessment.
Return ONLY a JSON object with NO additional text, following this EXACT format:

{
  "skinType": "oily/dry/combination/normal",
  "concerns": ["list specific concerns"],
  "features": {
    "moisture": "describe hydration level",
    "acne": "describe breakout severity",
    "darkSpots": "describe pigmentation",
    "pores": "describe pore appearance",
    "wrinkles": "describe fine lines",
    "texture": "describe skin texture",
    "redness": "describe inflammation",
    "elasticity": "describe firmness"
  },
  "recommendations": [
    {
      "category": "skincare",
      "productType": "specific product type",
      "reason": "why needed",
      "priority": 1,
      "ingredients": ["key ingredients"]
    }
  ]
}`;

    // Generate content
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image
        }
      }
    ]);

    // Wait for the response
    const response = await result.response;
    const text = response.text();
    console.log('Raw response:', text);

    try {
      // Parse the response
      const analysisData = JSON.parse(text);

      // Validate required fields
      const requiredFields = ['skinType', 'concerns', 'features', 'recommendations'];
      for (const field of requiredFields) {
        if (!analysisData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return analysisData as FacialAnalysis;
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      throw new Error('Invalid response format from Gemini API');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}