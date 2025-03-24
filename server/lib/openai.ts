import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

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

function validateImage(base64String: string): { isValid: boolean; error?: string } {
  try {
    // Check if it's a valid base64 string
    if (!/^[A-Za-z0-9+/=]+$/.test(base64String)) {
      return { isValid: false, error: "Invalid base64 format" };
    }

    // Check file size (20MB limit)
    const sizeInBytes = (base64String.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    if (sizeInMB > 20) {
      return { isValid: false, error: "Image size exceeds 20MB limit" };
    }

    // Check image dimensions
    const img = new Image();
    const buffer = Buffer.from(base64String, 'base64');

    // This is a basic check for JPEG/PNG headers.  More robust checks would be needed for production.
    const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8;
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50;

    if (!isJPEG && !isPNG) {
      return { isValid: false, error: "Image must be in JPEG or PNG format" };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: "Failed to validate image" };
  }
}

export async function analyzeFacialFeatures(base64Image: string): Promise<FacialAnalysis> {
  try {
    console.log('Starting OpenAI analysis with base64 image...');

    // Validate image first
    const validation = validateImage(base64Image);
    if (!validation.isValid) {
      throw new Error(validation.error || "Invalid image format");
    }

    // Ensure the base64 image is properly formatted
    const formattedImageUrl = base64Image.startsWith('data:image') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    console.log('Image validated, preparing OpenAI API request...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
                url: formattedImageUrl
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
      console.error('No content in OpenAI response');
      throw new Error("No analysis generated");
    }

    console.log('Parsing OpenAI response...');
    const analysisData = JSON.parse(result);

    // Validate required fields
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