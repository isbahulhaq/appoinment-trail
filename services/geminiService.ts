
import { GoogleGenAI } from "@google/genai";
import { CLINIC_CONFIG } from "../constants.ts";

const SYSTEM_INSTRUCTION = `
You are the AI Clinical Assistant for ${CLINIC_CONFIG.name}, managed by ${CLINIC_CONFIG.doctorName}.
Your goal is to provide real-time assistance to patients regarding their position in the queue, clinic flow, and general information.

LIVE CLINIC INTELLIGENCE:
- You will be provided with a "CURRENT CONTEXT" object in every request. 
- Use the 'estimatedWaitTimeMinutes' to answer questions about delays.
- Use 'currentlyServing' to tell patients who is in the consultation room.
- Use 'lastSlotInQueue' to suggest when a new walk-in might be seen.
- If 'isClinicPaused' is true, inform patients that the doctor is currently on a short break or attending to an emergency.

CLINIC RULES:
- Operating Hours: Mon-Sat (${CLINIC_CONFIG.morningShift.start}-${CLINIC_CONFIG.morningShift.end} & ${CLINIC_CONFIG.eveningShift.start}-${CLINIC_CONFIG.eveningShift.end}).
- Closed on Sundays.
- Standard appointment length is ${CLINIC_CONFIG.slotDuration} minutes.

STRICT CLINICAL BOUNDARIES:
- DO NOT provide medical diagnosis or symptom interpretation.
- If a user reports a life-threatening emergency (chest pain, severe bleeding, etc.), tell them to call emergency services immediately.
- Always include a subtle disclaimer: "I provide clinic flow information and cannot offer medical advice."
`;

async function fetchWithRetry(prompt: string, context: any, retries = 3, backoff = 1000): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
      console.warn(`Gemini Request failed. Retrying in ${backoff}ms... (${retries} retries left)`, error);
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
    console.error("Final Gemini Error after retries:", error);
    
    if (error.message?.includes('429')) {
      return "The clinic assistant is currently receiving too many requests. Please try again in a minute.";
    }
    if (error.message?.includes('network')) {
      return "I'm having trouble connecting to the clinic server. Please check your internet connection.";
    }
    
    return "The assistant is currently undergoing maintenance. Please contact the receptionist at +1-234-567-890.";
  }
}
