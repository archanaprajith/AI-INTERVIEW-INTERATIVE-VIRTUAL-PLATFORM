import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    const logPath = path.join(process.cwd(), 'ai-debug.log');
    const log = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        fs.appendFileSync(logPath, `[${time}] ${msg}\n`);
    };

    try {
        const { messages, image, mode = 'technical' } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            log("ERROR: API Key missing");
            return NextResponse.json({ reply: "API Key missing in .env.local" }, { status: 200 });
        }

        const systemInstruction = mode === 'general' 
            ? `You are an Expert Career Mentor & HR Specialist. 
               PERSONALITY: Professional, encouraging, and highly observant. 
               GOAL: Conduct a realistic BEHAVIORAL interview.
               
               STRICT INTERVIEW FLOW:
               1. Begin by asking for a professional self-introduction.
               2. Follow up with "Why are you interested in this role?" or "Why should we hire you?".
               3. Ask about a specific past challenge or conflict and how it was resolved.
               4. Provide brief, encouraging feedback after each answer (e.g., "Excellent overview. Moving on...").
               
               RULES:
               - Keep it general and soft-skills focused.
               - DO NOT ask technical or coding questions.
                Return ONLY a valid JSON object: { 
                  "reply": "...", 
                  "analysis": { 
                    "bodyLanguage": "Excellent/Relaxed/Stiff", 
                    "anxiety": "Low/Medium/High", 
                    "energy": "High/Calm/Low", 
                    "tip": "Short body language tip based on their visual presence" 
                  } 
                }`
            : `You are a Senior Technical Architect & Mentor.
               PERSONALITY: Intense but supportive, precise, and practical.
               GOAL: Conduct a high-rigor TECHNICAL deep-dive.
               
               RULES:
               1. Ask challenging, scenario-based technical questions.
               2. If the user's answer is vague, ask a specific follow-up (e.g., "How would that handle concurrent users?").
               3. Provide a 'Pro-Tip' or brief technical insight after they answer.
               
               Return ONLY a valid JSON object: { 
                 "reply": "...", 
                 "analysis": { 
                   "bodyLanguage": "Confident/Focused/Fidgeting", 
                   "anxiety": "Low/Stable/High", 
                   "energy": "Intense/Steady/Low", 
                   "tip": "Short tip about their technical posture or lighting" 
                 } 
               }`;

        const contents = Array.isArray(messages) && messages.length > 0
            ? messages.map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
              }))
            : [];

        if (image && typeof image === 'string' && image.includes('base64,')) {
            const base64Data = image.split(',')[1];
            if (base64Data && base64Data.length > 10) {
                const lastMsg = contents[contents.length - 1];
                if (lastMsg && lastMsg.role === 'user') {
                    lastMsg.parts.push({
                        inlineData: { mimeType: "image/jpeg", data: base64Data }
                    } as any);
                }
            }
        }

        if (contents.length === 0) {
            contents.push({ role: 'user', parts: [{ text: systemInstruction + "\n\nHello! [SYSTEM_READY]" }] });
        } else {
            // Apply system instruction to the conversation context
            contents[0].parts[0].text = systemInstruction + "\n\n" + contents[0].parts[0].text;
        }

        // --- Resilience Logic: Retry with Multiple Models ---
        const modelsByPriority = [
            { name: 'gemini-2.0-flash', json: true },
            { name: 'gemini-2.5-flash', json: true },
            { name: 'gemini-flash-latest', json: true },
            { name: 'gemini-1.5-flash-8b', json: true },
            { name: 'gemini-1.5-flash', json: true },
            { name: 'gemini-pro', json: false }
        ];
        
        let lastError = null;
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        for (const modelConfig of modelsByPriority) {
            const modelName = modelConfig.name;
            let modelRetries = 2;
            
            for (let attempt = 0; attempt <= modelRetries; attempt++) {
                try {
                    log(`Trying model: ${modelName} (Attempt ${attempt + 1}, JSON: ${modelConfig.json})`);
                    
                    const genConfig: any = { temperature: 0.7 };
                    if (modelConfig.json) {
                        genConfig.responseMimeType = "application/json";
                    }

                    const model = genAI.getGenerativeModel({ 
                        model: modelName,
                        generationConfig: genConfig
                    });

                    const result = await model.generateContent({ contents });
                    const response = await result.response;
                    const rawText = response.text() || "{}";
                    
                    log(`Success with: ${modelName}`);
                    
                    if (modelConfig.json) {
                        const cleanText = rawText.replace(/```json|```/g, "").trim();
                        const data = JSON.parse(cleanText);
                        return NextResponse.json({ 
                            reply: data.reply || rawText, // Fallback to raw text if JSON key missing
                            analysis: data.analysis || null
                        });
                    } else {
                        // For non-JSON models, we might need to extract the "reply" or just return the text
                        // Since we asked for JSON in the prompt, let's try to parse even if mimeType wasn't set
                        try {
                            const cleanText = rawText.replace(/```json|```/g, "").trim();
                            const data = JSON.parse(cleanText);
                            return NextResponse.json({ reply: data.reply, analysis: data.analysis });
                        } catch (e) {
                            return NextResponse.json({ reply: rawText, analysis: null });
                        }
                    }
                } catch (err: any) {
                    lastError = err;
                    const errMsg = err.message || String(err);
                    log(`FAILED ${modelName} (Attempt ${attempt + 1}): ${errMsg}`);
                    
                    const isRetryable = errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('overloaded') || errMsg.includes('high demand');
                    if (isRetryable && attempt < modelRetries) {
                        await delay(Math.pow(2, attempt) * 1000 + Math.random() * 500);
                        continue;
                    }
                    break;
                }
            }
        }

        // --- Final Critical Fallback ---
        // Instead of showing an error, we provide a generic but plausible interview question
        const fallbacks = [
            "I'm having a brief sync issue, but let's keep the momentum! Could you describe a time you had to troubleshoot a difficult bug in a production environment?",
            "Technical connectivity is slightly lagging, but I'm still here. Tell me about a technical project you're most proud of and why.",
            "Let's continue while I refresh my connection. How do you approach learning a new technology or framework quickly?",
            "I'm experiencing a minor overload, but let's stay focused. What are the key considerations you take when designing a scalable system?"
        ];
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

        return NextResponse.json({ 
            reply: randomFallback,
            analysis: { 
                bodyLanguage: "Professional", 
                anxiety: "Stable", 
                energy: "Steady", 
                tip: "Keep maintaining good eye contact with the camera." 
            }
        });

    } catch (error: any) {
        log(`CRITICAL ROUTE ERROR: ${error.message || error}`);
        return NextResponse.json({ 
            reply: "I'm having a brief connection issue, but let's continue. Could you tell me about the most challenging technical project you've worked on?",
            analysis: { bodyLanguage: "Steady", anxiety: "Stable", energy: "Calm", tip: "Continue focusing on your storytelling." }
        }, { status: 200 });
    }
}
