import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface FacialAnalysis {
  skinType: string;
  concerns: string[];
  features: {
    eyes: string;
    lips: string;
    cheeks: string;
    general: string;
  };
  recommendations: {
    category: string;
    reason: string;
  }[];
}

export async function analyzeFacialFeatures(base64Image: string): Promise<FacialAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional beauty advisor. Analyze the facial features and provide beauty product recommendations. Respond with detailed JSON."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this person's facial features and recommend beauty products. Include skin type, concerns, and specific product recommendations."
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

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    throw new Error(`Failed to analyze facial features: ${error.message}`);
  }
}
