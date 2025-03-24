import Ollama from 'ollama';

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
    console.log('Starting Ollama analysis with base64 image...');

    const ollama = new Ollama({
      host: 'http://localhost:11434'
    });

    const prompt = `Analyze this facial image and provide a detailed skin assessment. Return ONLY a JSON object with NO additional text in this exact format: {"skinType": "dry/oily/combination/normal", "concerns": ["list concerns"], "features": {"moisture": "description", "acne": "description", "darkSpots": "description", "pores": "description", "wrinkles": "description", "texture": "description", "redness": "description", "elasticity": "description"}, "recommendations": [{"category": "type", "productType": "specific product", "reason": "why needed", "priority": 1, "ingredients": ["key ingredients"]}]}`;

    const response = await ollama.chat({
      model: 'o1',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image',
              data: base64Image
            }
          ]
        }
      ]
    });

    console.log('Ollama response received:', response);

    // Parse the response and ensure it's valid JSON
    const analysisData = JSON.parse(response.message.content);

    // Validate required fields
    if (!analysisData.skinType || !analysisData.concerns || !analysisData.features || !analysisData.recommendations) {
      throw new Error('Invalid response format: missing required fields');
    }

    return analysisData as FacialAnalysis;
  } catch (error) {
    console.error('Ollama API error:', error);
    throw new Error('Failed to analyze facial features. Please try again with a clear photo.');
  }
}