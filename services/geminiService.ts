
import { GoogleGenAI } from "@google/genai";
import { CLINIC_CONFIG } from "../constants";

const SYSTEM_INSTRUCTION = `
You are the Professional Clinical AI Assistant for ${CLINIC_CONFIG.name}.
Managed by: ${CLINIC_CONFIG.doctorName}.

BILINGUAL CAPABILITY:
- Support English, Hindi, and Hinglish.
- Respond in the language the user uses. If they ask in Hindi/Hinglish, reply in Hinglish/Hindi for better comfort.
- Example: "Aapka number 15 minute mein aayega" instead of just "Your turn is in 15 minutes."

LIVE CLINIC INTELLIGENCE:
- You have real-time access to the queue. 
- Use the provided context to tell patients exactly how many people are ahead of them.
- Operating Hours: ${CLINIC_CONFIG.morningShift.start}-${CLINIC_CONFIG.morningShift.end} & ${CLINIC_CONFIG.eveningShift.start}-${CLINIC_CONFIG.eveningShift.end}.

STRICT CLINICAL BOUNDARIES:
- DO NOT provide medical diagnosis or prescribe medicine.
- For emergencies, tell them to visit the ER immediately.
- Disclaimer: "Main clinic flow ki jankari deta hoon, medical advice nahi."
`;

export async function askChatbot(prompt: string, context: any): Promise<string> {
  // Always initialize fresh to ensure latest key/session
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + `\n\nCURRENT CONTEXT:\n${JSON.stringify(context)}`,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    return response.text || "I'm having trouble understanding. Please try again.";
  } catch (error: any) {
    console.error("Clinical AI Sync Error:", error);
    return "Maaf kijiye, abhi system busy hai. Aap reception par pooch sakte hain.";
  }
}
