import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are a professional dermatologist and beauty advisor. Analyze facial features and provide beauty recommendations. 
          Format your response EXACTLY as a JSON object with no additional text.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this facial image and provide a detailed skin assessment. Return the analysis in this exact JSON format:
              {
                "skinType": "dry/oily/combination/normal",
                "concerns": ["specific skin concerns"],
                "features": {
                  "moisture": "hydration level description",
                  "acne": "breakout assessment",
                  "darkSpots": "pigmentation analysis",
                  "pores": "pore condition",
                  "wrinkles": "fine lines assessment",
                  "texture": "texture description",
                  "redness": "inflammation analysis",
                  "elasticity": "firmness assessment"
                },
                "recommendations": [
                  {
                    "category": "skincare/treatment",
                    "productType": "specific product type",
                    "reason": "why this is recommended",
                    "priority": 1-5 (1 being highest),
                    "ingredients": ["key beneficial ingredients"]
                  }
                ]
              }`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error("No analysis generated");
    }

    const analysisData = JSON.parse(result);

    // Validate response structure
    if (!analysisData.skinType || !analysisData.concerns || !analysisData.features || !analysisData.recommendations) {
      throw new Error("Invalid response format: missing required fields");
    }

    return analysisData as FacialAnalysis;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to analyze facial features. Please try again with a clear photo.');
  }
}