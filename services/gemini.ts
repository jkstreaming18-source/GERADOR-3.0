
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ImageData, FunctionType, Mode, AspectRatio } from "../types";

const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateImageContent = async (
  prompt: string,
  mode: Mode,
  functionType: FunctionType,
  aspectRatio: AspectRatio,
  image1?: ImageData | null,
  image2?: ImageData | null
): Promise<string> => {
  // Inicialização obrigatória conforme diretrizes
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];
  
  // Refinamento de prompts por função
  let finalPrompt = prompt;
  if (mode === Mode.CREATE) {
    if (functionType === 'sticker') finalPrompt = `Sticker die-cut style: ${prompt}. High quality, white border, isolated.`;
    if (functionType === 'text') finalPrompt = `Professional minimalist logo: ${prompt}. Vector style, clean lines.`;
    if (functionType === 'comic') finalPrompt = `Comic book art style: ${prompt}. Vibrant, dynamic shadows.`;
  } else {
    if (functionType === 'add-remove') finalPrompt = `Modify this image: ${prompt}. Preserve original style and lighting.`;
    if (functionType === 'retouch') finalPrompt = `Enhance and retouch: ${prompt}. Fix details, lighting and clarity.`;
    if (functionType === 'style') finalPrompt = `Re-style this image as: ${prompt}. Artistic transformation.`;
    if (functionType === 'compose') finalPrompt = `Merge these two images based on: ${prompt}. Seamless composite.`;
  }

  parts.push({ text: finalPrompt });

  if (image1) {
    parts.push({
      inlineData: {
        data: image1.base64,
        mimeType: image1.mimeType
      }
    });
  }

  if (image2) {
    parts.push({
      inlineData: {
        data: image2.base64,
        mimeType: image2.mimeType
      }
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    // Extração correta da parte de imagem conforme regras do SDK
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image part found in response");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
