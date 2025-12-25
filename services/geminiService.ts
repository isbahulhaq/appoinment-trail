
import { GoogleGenAI } from "@google/genai";
import { CLINIC_CONFIG } from "../constants";

const SYSTEM_INSTRUCTION = `
You are the AI Clinical Assistant for ${CLINIC_CONFIG.name}, managed by ${CLINIC_CONFIG.doctorName}.
Your goal is to provide real-time assistance to patients regarding their position in the queue, clinic flow, and general information.

LIVE CLINIC INTELLIGENCE:
- You will be provided with a "CURRENT CONTEXT" object in every request. 
- Use context data to answer precisely about wait times and current sessions.
- If 'isClinicPaused' is true, inform patients that the doctor is currently on a short break.

CLINIC RULES:
- Operating Hours: Mon-Sat (${CLINIC_CONFIG.morningShift.start}-${CLINIC_CONFIG.morningShift.end} & ${CLINIC_CONFIG.eveningShift.start}-${CLINIC_CONFIG.eveningShift.end}).
- Standard appointment length is ${CLINIC_CONFIG.slotDuration} minutes.

STRICT CLINICAL BOUNDARIES:
- DO NOT provide medical diagnosis.
- For emergencies, tell them to call emergency services.
- Disclaimer: "I provide clinic flow information and cannot offer medical advice."
`;

async function fetchWithRetry(prompt: string, context: any, retries = 3, backoff = 1000): Promise<string> {
  const apiKey = (window as any).process?.env?.API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    return "The AI assistant is currently in offline mode (API key missing). Please check your clinic's dashboard configuration.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + `\n\n[CRITICAL] CURRENT CLINIC CONTEXT:\n${JSON.stringify(context, null, 2)}`,
        temperature: 0.7,
      },
    });

    if (!response.text) {
       throw new Error("Empty response from AI model.");
    }
    
    return response.text;
  } catch (error: any) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(prompt, context, retries - 1, backoff * 2);
    }
    throw error;
  }
}

export async function askChatbot(prompt: string, context: any) {
  try {
    return await fetchWithRetry(prompt, context);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return "The assistant is temporarily unavailable. Please speak with the receptionist.";
  }
}
