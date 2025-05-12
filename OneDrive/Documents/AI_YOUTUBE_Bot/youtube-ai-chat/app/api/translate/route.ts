import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI API key not set' }, { status: 500 });
    }

    const prompt = `Translate the following text to ${targetLanguage}. Maintain the original meaning, context, and formatting while providing a natural translation:\n\nText:\n${text}\n\nTranslation:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const data = await response.json();
    const translation = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Translation failed';

    return NextResponse.json({ translation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to translate' }, { status: 500 });
  }
} 