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

    const prompt = `You are a professional beauty advisor and dermatologist. Analyze this person's facial features and provide detailed recommendations. 
    Provide ONLY a valid JSON response with NO additional text, following this EXACT structure:
    {
      "skinType": "specify skin type",
      "concerns": ["list", "of", "concerns"],
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
          "priority": 1,
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

    try {
      // Attempt to parse the entire response as JSON first
      const analysisData = JSON.parse(text);
      console.log('Successfully parsed analysis data');
      return analysisData as FacialAnalysis;
    } catch (parseError) {
      console.error('Failed to parse direct JSON response, attempting to extract JSON:', parseError);

      // If direct parsing fails, try to extract JSON from the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not find JSON structure in Gemini response");
      }

      try {
        const extractedData = JSON.parse(jsonMatch[0]);
        return extractedData as FacialAnalysis;
      } catch (extractError) {
        console.error('Failed to parse extracted JSON:', extractError);
        throw new Error("Invalid JSON format in Gemini response");
      }
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to analyze facial features: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}