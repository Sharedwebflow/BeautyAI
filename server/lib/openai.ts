
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are a professional beauty advisor and dermatologist with expertise in facial analysis and skincare.
          Analyze facial features in detail and provide comprehensive beauty recommendations.
          Consider skin type, texture, symmetry, and specific facial features.
          Provide specific product recommendations with ingredient suggestions.
          Format the response as a detailed JSON object.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please provide a detailed analysis of this person's facial features and beauty characteristics. Include skin type, concerns, detailed feature analysis, and specific product recommendations with ingredients."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as FacialAnalysis;
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to analyze facial features: ${err.message}`);
  }
}
