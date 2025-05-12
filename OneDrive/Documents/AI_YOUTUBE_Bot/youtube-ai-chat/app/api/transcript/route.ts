import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { url, language = 'en' } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    return await new Promise<Response>((resolve) => {
      const pythonScript = path.join(process.cwd(), 'scripts', 'get_transcript.py');
      const pythonProcess = spawn('python', [pythonScript, url, language]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          resolve(NextResponse.json({ error: error || 'Failed to fetch transcript' }, { status: 500 }));
          return;
        }

        try {
          const data = JSON.parse(result);
          if (data.error) {
            resolve(NextResponse.json({ error: data.error }, { status: 400 }));
            return;
          }
          resolve(NextResponse.json(data));
        } catch (e) {
          resolve(NextResponse.json({ error: 'Failed to parse transcript data' }, { status: 500 }));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch transcript' }, { status: 500 });
  }
} 