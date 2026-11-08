import { NextRequest, NextResponse } from 'next/server';
import { evaluateResume } from '@/lib/ai';

// Note: bodyParser config is deprecated in App Router. 
// Large bodies are handled by streaming or Request.json() limit settings (if any).

export async function POST(request: NextRequest) {
    try {
        console.log("Resume evaluation request received...");
        const body = await request.json();
        const { resumeText, imageInfo } = body;

        if (!resumeText && !imageInfo) {
            console.warn("Empty request: No text or image provided.");
            return NextResponse.json({ error: 'Missing resume content (text or image)' }, { status: 400 });
        }

        console.log(`Evaluating ${imageInfo ? 'Image' : 'Text'} Resume...`);
        
        // Call the TS native Gemini wrapper with optional image support
        const evaluation = await evaluateResume(resumeText || "", "", imageInfo);

        console.log("Evaluation complete successfully.");
        return NextResponse.json(evaluation);

    } catch (error: any) {
        console.error('CRITICAL Resume Evaluation Error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred while analyzing the resume.', details: error.message },
            { status: 500 }
        );
    }
}
