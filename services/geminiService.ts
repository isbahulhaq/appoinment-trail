
import { GoogleGenAI, Type } from "@google/genai";
import { CLINIC_CONFIG } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are the AI Assistant for ${CLINIC_CONFIG.name}, managed by ${CLINIC_CONFIG.doctorName}.
Your goal is to help patients with booking, clinic info, and appointment status.

CLINIC RULES:
- Timings: Mon-Sat (${CLINIC_CONFIG.morningShift.start}-${CLINIC_CONFIG.morningShift.end} & ${CLINIC_CONFIG.eveningShift.start}-${CLINIC_CONFIG.eveningShift.end}). Sunday Closed.
- Standard consultation: 15 minutes.
- Walk-ins allowed but scheduled appointments prioritized.
- Emergencies take precedence.

STRICT GUIDELINES:
- DO NOT provide medical diagnosis.
- DO NOT give prescription advice.
- If a user asks for medical help, advise them to visit the clinic or call emergency services.
- Keep responses professional, helpful, and concise.
- Always include a disclaimer: "I am an AI assistant and cannot provide medical advice. Please consult with the doctor for health concerns."
`;

export async function askChatbot(prompt: string, context: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + `\n\nCURRENT CONTEXT:\n${JSON.stringify(context)}`,
        temperature: 0.7,
      },
    });
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The assistant is currently unavailable. Please contact the receptionist at +1-234-567-890.";
  }
}
