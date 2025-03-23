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
    console.log('Initializing Gemini model');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro-vision",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      }
    });

    const prompt = `As a dermatologist, analyze this facial image and provide a detailed skin assessment.
Return ONLY a JSON object with NO additional text, following this EXACT format:

{
  "skinType": "oily/dry/combination/normal",
  "concerns": ["list specific skin concerns"],
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

    console.log('Sending request to Gemini API');
    const result = await model.generateContent([
      {
        role: "user",
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }
    ]);

    const response = await result.response;
    const text = response.text();
    console.log('Raw response:', text);

    // Clean up any markdown formatting
    const cleanText = text.replace(/```json|```/g, '').trim();

    try {
      const analysisData = JSON.parse(cleanText);

      // Validate required fields are present
      const requiredFields = ['skinType', 'concerns', 'features', 'recommendations'];
      for (const field of requiredFields) {
        if (!analysisData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate features
      const requiredFeatures = [
        'moisture', 'acne', 'darkSpots', 'pores', 
        'wrinkles', 'texture', 'redness', 'elasticity'
      ];
      for (const feature of requiredFeatures) {
        if (typeof analysisData.features[feature] !== 'string') {
          throw new Error(`Invalid or missing feature: ${feature}`);
        }
      }

      // Validate recommendations
      if (!Array.isArray(analysisData.recommendations) || analysisData.recommendations.length === 0) {
        throw new Error('Recommendations must be a non-empty array');
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