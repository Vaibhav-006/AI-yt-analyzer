import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, language = 'en' } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI API key not set' }, { status: 500 });
    }

    const prompt = `You are an expert document analyzer. Analyze the following text and provide a detailed summary, key points, and insights.\n\nText:\n${text}\n\nAnalysis:`;

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
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis generated.';

    return NextResponse.json({ analysis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to analyze document' }, { status: 500 });
  }
} 