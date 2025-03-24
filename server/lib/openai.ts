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
    console.log('Starting OpenAI analysis with base64 image...');

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "As a dermatologist, analyze this facial image and provide a detailed skin assessment. Return ONLY a JSON object with NO additional text in this exact format: {\"skinType\": \"dry/oily/combination/normal\", \"concerns\": [\"list concerns\"], \"features\": {\"moisture\": \"description\", \"acne\": \"description\", \"darkSpots\": \"description\", \"pores\": \"description\", \"wrinkles\": \"description\", \"texture\": \"description\", \"redness\": \"description\", \"elasticity\": \"description\"}, \"recommendations\": [{\"category\": \"type\", \"productType\": \"specific product\", \"reason\": \"why needed\", \"priority\": 1, \"ingredients\": [\"key ingredients\"]}]}"
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
      max_tokens: 4096,
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    console.log('OpenAI API response received');

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error("No analysis generated");
    }

    console.log('Parsing response...');
    const analysisData = JSON.parse(result);

    // Simple validation
    if (!analysisData.skinType || !analysisData.concerns || !analysisData.features || !analysisData.recommendations) {
      console.error('Invalid response structure:', analysisData);
      throw new Error("Invalid response format: missing required fields");
    }

    return analysisData as FacialAnalysis;
  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error instanceof Error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
    throw new Error('Failed to analyze facial features. Please try again.');
  }
}