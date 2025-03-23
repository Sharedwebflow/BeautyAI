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

    const prompt = `As a beauty advisor, analyze this facial image and respond with ONLY a JSON object in this exact format (no markdown, no extra text):
    {
      "skinType": "normal/combination/oily/dry",
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
          "category": "skincare/makeup",
          "productType": "specific type",
          "reason": "explanation",
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

    // Remove any markdown formatting and find JSON
    const cleanText = text.replace(/```json\n|\n```|```/g, '');
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Could not find valid JSON in response");
    }

    const analysisData = JSON.parse(jsonMatch[0]);

    // Validate the response structure
    if (!analysisData.skinType || !analysisData.concerns || !analysisData.features || !analysisData.recommendations) {
      throw new Error("Invalid response format: missing required fields");
    }

    // Ensure all required feature fields exist
    const requiredFeatures = ['eyes', 'lips', 'cheeks', 'jawline', 'forehead', 'noseShape', 'skinTexture', 'symmetry'];
    for (const feature of requiredFeatures) {
      if (!analysisData.features[feature]) {
        throw new Error(`Invalid response format: missing feature ${feature}`);
      }
    }

    // Validate recommendations format
    if (!Array.isArray(analysisData.recommendations) || analysisData.recommendations.length === 0) {
      throw new Error("Invalid response format: recommendations must be a non-empty array");
    }

    for (const rec of analysisData.recommendations) {
      if (!rec.category || !rec.productType || !rec.reason || !rec.priority || !Array.isArray(rec.ingredients)) {
        throw new Error("Invalid response format: invalid recommendation structure");
      }
    }

    console.log('Successfully validated analysis data');
    return analysisData as FacialAnalysis;
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error(`Failed to analyze facial features: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}