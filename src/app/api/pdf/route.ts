import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Check multiple possible paths - prioritize test.pdf
    const possiblePaths = [
      join(process.cwd(), 'public', 'files', 'test.pdf'),
      join(process.cwd(), 'public', 'files', 'Real_Estate_Form.pdf'),
      join(process.cwd(), 'public', 'test.pdf'),
      join(process.cwd(), 'test.pdf'),
    ];

    let pdfPath = null;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        pdfPath = path;
        console.log('✅ API: Found PDF at:', path);
        break;
      }
    }

    if (!pdfPath) {
      console.error('❌ API: PDF file not found in any of the expected locations');
      console.log('🔍 API: Checked paths:', possiblePaths);
      return NextResponse.json(
        { error: 'PDF file not found. Please ensure test.pdf exists in public/files/' },
        { status: 404 }
      );
    }

    const pdfBuffer = readFileSync(pdfPath);
    console.log('📄 API: PDF size:', pdfBuffer.length, 'bytes');

    // Verify it's actually a PDF
    const header = pdfBuffer.slice(0, 4).toString();
    if (header !== '%PDF') {
      console.error('❌ API: Invalid PDF header:', header);
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      );
    }

    console.log('✅ API: Serving PDF successfully');
    
    // Return the PDF with proper headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('❌ API: Error serving PDF:', error);
    return NextResponse.json(
      { error: 'Failed to load PDF file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 