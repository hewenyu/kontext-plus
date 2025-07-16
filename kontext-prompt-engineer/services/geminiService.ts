
import { GoogleGenAI, Type } from "@google/genai";
import { PromptParts } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

if (!process.env.GOOGLE_GEMINI_BASE_URL) {
  throw new Error("GOOGLE_GEMINI_BASE_URL environment variable not set");
}

const httpOptions = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  baseUrl: process.env.GOOGLE_GEMINI_BASE_URL,
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, httpOptions });

const schema = {
  type: Type.OBJECT,
  properties: {
    target: { type: Type.STRING, description: "The specific object, person, or area to be edited. Be concise and clear." },
    change: { type: Type.STRING, description: "A detailed description of the desired modification or transformation." },
    preserve: { type: Type.STRING, description: "A comma-separated list of all important elements that must remain unchanged. Infer this from context. For example, if changing a shirt, preserve the person's face, hair, and the background." },
    style: { type: Type.STRING, description: "The desired artistic style, quality, or technical parameters (e.g., 'photorealistic, 4k, cinematic lighting'). If not specified, use 'highly detailed, photorealistic'." }
  },
  required: ["target", "change", "preserve", "style"]
};

export const generatePromptParts = async (rawUserInput: string): Promise<PromptParts> => {
  try {
    const systemInstruction = `You are a world-class prompt engineer specializing in the FLUX.1 Kontext image editing tool. Your task is to take a user's simple, natural language request for an image edit (which may be in Chinese) and deconstruct it into a structured format with English values, suitable for generating a professional Kontext prompt. You must identify the key components of the edit: what to change, how to change it, what to keep the same, and the desired style. It is crucial to infer what should be preserved even if the user doesn't explicitly state it. For example, if a user says "change the woman's shirt to red", you must infer that the woman's face, hair, and the background should be preserved. Respond ONLY with a valid JSON object matching the provided schema, with all values in English.`;

    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${systemInstruction}\n\nUser's request: "${rawUserInput}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        }
    });

    const jsonString = result.text;
    const parsedJson = JSON.parse(jsonString);

    return {
        target: parsedJson.target || '',
        change: parsedJson.change || '',
        preserve: parsedJson.preserve || '',
        style: parsedJson.style || '',
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`生成提示词结构失败: ${error.message}`);
    }
    throw new Error("联系AI助手时发生未知错误。");
  }
};
