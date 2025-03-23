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
      model: "gemini-pro-vision",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      }
    });

    const prompt = `Analyze this facial image and provide skin assessment in JSON format. Include ONLY the JSON object with these exact fields:
{
  "skinType": "oily/dry/combination/normal",
  "concerns": ["concern1", "concern2"],
  "features": {
    "moisture": "hydration level",
    "acne": "breakout description",
    "darkSpots": "pigmentation details",
    "pores": "pore description",
    "wrinkles": "fine line assessment",
    "texture": "texture description",
    "redness": "inflammation level",
    "elasticity": "firmness details"
  },
  "recommendations": [
    {
      "category": "skincare",
      "productType": "product name",
      "reason": "brief explanation",
      "priority": 1,
      "ingredients": ["ingredient1", "ingredient2"]
    }
  ]
}`;

    console.log('Sending request to Gemini API');
    const result = await model.generateContent([
      {
        parts: [
          { text: prompt },
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

    // Clean up the response text
    const cleanText = text.replace(/```json|```/g, '').trim();
    console.log('Cleaned text:', cleanText);

    try {
      const analysisData = JSON.parse(cleanText);
      console.log('Parsed data:', analysisData);

      // Validate structure
      if (!analysisData.skinType || !analysisData.concerns || !analysisData.features || !analysisData.recommendations) {
        throw new Error("Missing required fields in response");
      }

      // Validate features
      const requiredFeatures = ['moisture', 'acne', 'darkSpots', 'pores', 'wrinkles', 'texture', 'redness', 'elasticity'];
      for (const feature of requiredFeatures) {
        if (typeof analysisData.features[feature] !== 'string') {
          throw new Error(`Missing or invalid feature: ${feature}`);
        }
      }

      // Validate recommendations
      if (!Array.isArray(analysisData.recommendations) || analysisData.recommendations.length === 0) {
        throw new Error("Invalid recommendations format");
      }

      return analysisData as FacialAnalysis;
    } catch (parseError) {
      console.error('Parse error:', parseError);
      throw new Error(`Failed to parse analysis result: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to analyze facial features: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}