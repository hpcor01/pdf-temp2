import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// Helper to convert blob/url to base64
export const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g., "data:image/jpeg;base64,")
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const removeBackground = async (imageUrl: string): Promise<string> => {
  const ai = getAiClient();
  const base64Data = await urlToBase64(imageUrl);

  const model = "gemini-2.5-flash-image";
  const prompt = "Remove the background from this image. Return ONLY the object with a white or transparent background. Keep the main subject intact.";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
    });

    // We expect the model to return an image in the response
    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image returned from AI");
  } catch (error) {
    console.error("Gemini Background Removal Error:", error);
    throw error;
  }
};

export const enhanceImage = async (imageUrl: string): Promise<string> => {
  const ai = getAiClient();
  const base64Data = await urlToBase64(imageUrl);

  const model = "gemini-2.5-flash-image";
  const prompt = "Enhance the sharpness, clarity, and lighting of this image. Make it look professional and high quality. Return the enhanced image.";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image returned from AI");
  } catch (error) {
    console.error("Gemini Enhancement Error:", error);
    throw error;
  }
};