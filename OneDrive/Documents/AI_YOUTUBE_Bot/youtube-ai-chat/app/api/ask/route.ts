import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { question, transcript } = await req.json();
    if (!question || !transcript) {
      return NextResponse.json({ error: 'Missing question or transcript' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI API key not set' }, { status: 500 });
    }

    const prompt = `You are an expert assistant. Answer the following question based on the transcript below.\n\nTranscript:\n${transcript}\n\nQuestion: ${question}\nAnswer:`;

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
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer generated.';

    return NextResponse.json({ answer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to get answer' }, { status: 500 });
  }
} 