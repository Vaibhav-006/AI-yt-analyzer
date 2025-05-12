import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { writeFile } from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const language = formData.get('language') as string || 'en';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Save the uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(tempDir, file.name);
    await writeFile(filePath, buffer);

    // Process the PDF using Python script
    return await new Promise<Response>((resolve) => {
      const pythonScript = path.join(process.cwd(), 'scripts', 'process_pdf.py');
      const pythonProcess = spawn('python', [pythonScript, filePath, language]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Clean up the temporary file
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting temporary file:', err);
        });

        if (code !== 0) {
          resolve(NextResponse.json({ error: error || 'Failed to process PDF' }, { status: 500 }));
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
          resolve(NextResponse.json({ error: 'Failed to parse PDF data' }, { status: 500 }));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process PDF' }, { status: 500 });
  }
} 