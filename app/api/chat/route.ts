import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
    try {
        const { messages, image } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('Chat Route Failure: GEMINI_API_KEY is missing from environment variables');
            return NextResponse.json({ 
                reply: "I'm sorry, I'm missing my AI API key configuration. Please check your .env.local file." 
            }, { status: 200 });
        }

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // Format contents for SDK
        const contents = messages.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));


        // Add multimodal image if provided
        if (image && contents.length > 0) {
            const lastMsg = contents[contents.length - 1];
            if (lastMsg.role === 'user') {
                lastMsg.parts.push({
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: image
                    }
                } as any);
            }
        }

        const systemInstruction = `You are a World-Class AI Interview Coach. 
        Conduct a high-stakes professional interview. Speak one question at a time.
        
        CRITICAL: Analyze the user's non-verbal cues (body language, energy) and mental state (anxiety, confidence) based on the visual input and their transcript quality.
        
        Return ONLY a raw JSON object with this exact schema:
        {
          "reply": "Your next interview question",
          "analysis": {
             "bodyLanguage": "Brief observation",
             "energy": "Description",
             "anxiety": "Level",
             "tip": "One short coaching tip"
          }
        }`;

        // Prepend system instruction to the first message for SDK compatibility
        if (contents.length > 0 && contents[0].role === 'user') {
            contents[0].parts[0].text = systemInstruction + '\n\n' + contents[0].parts[0].text;
        } else if (contents.length === 0) {
            // Updated greeting to confirm version to the user
            contents.push({ role: 'user', parts: [{ text: systemInstruction + "\n\n[SYSTEM READY V2.5.1] Hello! I am your AI Interview Coach. Can you hear me?" }] });
        }

        const API_VERSION = "2.5.1-SDK";
        console.log(`[${new Date().toLocaleTimeString()}] Chat API ${API_VERSION}: Using SDK for Gemini 2.5-flash...`);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                responseMimeType: "application/json",
                temperature: 0.7
            }
        });

        const rawText = response.text || "{}";
        const cleanText = rawText.replace(/```json|```/g, "").trim();
        
        try {
            const data = JSON.parse(cleanText);
            return NextResponse.json({ 
                reply: data.reply || "I'm sorry, I'm having trouble thinking of a question. Could you repeat that?",
                analysis: data.analysis || null
            });
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError, 'Raw Text:', rawText);
            return NextResponse.json({ 
                reply: rawText,
                analysis: null
            });
        }

    } catch (error: any) {
        console.error('Chat Route Critical Failure:', error.message || error);
        return NextResponse.json({ 
            reply: "I'm having a bit of trouble connecting to my brain right now. " + 
                   (error.message?.toString().includes('403') || error.message?.toString().includes('401') 
                    ? "It looks like an API key or permission issue." 
                    : "Please check your internet connection or API key!")
        }, { status: 200 });
    }
}
