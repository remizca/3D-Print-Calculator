import { GoogleGenAI, Type } from "@google/genai";
import { GcodeInfo } from "../types";

// This file is new
// It provides a fallback mechanism to parse G-code using the Gemini AI
// when the local regex-based parser fails.

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Define the expected JSON structure for the AI's response
const responseSchema = {
    type: Type.OBJECT,
    properties: {
        printTimeSeconds: { type: Type.NUMBER, description: "The total print time in seconds.", nullable: true },
        filamentWeightG: { type: Type.NUMBER, description: "The weight of the filament used in grams.", nullable: true },
        filamentLengthMm: { type: Type.NUMBER, description: "The length of the filament used in millimeters.", nullable: true },
    }
};


export const analyzeGcodeWithAI = async (gcode: string): Promise<GcodeInfo> => {
    // We only need the header comments, so we take the first 200 lines to save tokens.
    const gcodeHeader = gcode.split('\n').slice(0, 200).join('\n');
    
    const prompt = `
        Analyze the following 3D printer G-code file header. Your task is to extract very specific information from the comments.

        G-code Header:
        ---
        ${gcodeHeader}
        ---

        Please extract the following values and provide them in a JSON object format:
        1.  **printTimeSeconds**: The total estimated print time converted to **seconds**. Look for comments like "print time", "estimated printing time", etc. Handle formats like "1d 12h 30m 5s".
        2.  **filamentWeightG**: The total filament weight used in **grams (g)**. Look for comments like "filament weight", "filament used [g]", etc.
        3.  **filamentLengthMm**: The total filament length used in **millimeters (mm)**. Look for "filament used" or "filament length". If it's in meters (m), convert it to millimeters.

        If a value is not present in the G-code header, please return 'null' for that field in the JSON object.
    `;

    try {
        console.log("Requesting G-code analysis from Gemini AI...");
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                // Lower temperature for more predictable, factual extraction
                temperature: 0.1,
            }
        });

        const jsonText = response.text.trim();
        console.log("Received AI analysis:", jsonText);
        // FIX: Corrected typo from `jsontext` to `jsonText`.
        const parsedJson = JSON.parse(jsonText);
        
        // Ensure all fields are present, defaulting to null if missing from AI response
        const result: GcodeInfo = {
            printTimeSeconds: parsedJson.printTimeSeconds ?? null,
            filamentWeightG: parsedJson.filamentWeightG ?? null,
            filamentLengthMm: parsedJson.filamentLengthMm ?? null,
        }
        return result;

    } catch (error) {
        console.error("Error during Gemini API call for G-code analysis:", error);
        throw new Error("The AI service failed to analyze the G-code file.");
    }
};
