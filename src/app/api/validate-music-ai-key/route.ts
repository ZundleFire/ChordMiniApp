import { NextRequest, NextResponse } from 'next/server';

interface ValidationRequest {
  apiKey: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ValidationRequest;
    const apiKey = (body.apiKey || '').trim();

    if (!apiKey) {
      return NextResponse.json({ valid: false, error: 'API key is required' }, { status: 400 });
    }

    const keyLooksValid = /^[a-zA-Z0-9]{16,}$/.test(apiKey) || /^[0-9a-f-]{36}$/i.test(apiKey);
    if (!keyLooksValid) {
      return NextResponse.json(
        { valid: false, error: 'Invalid key format.' },
        { status: 400 }
      );
    }

    // Free synchronized lyrics mode is default; remote key validation is no longer required.
    return NextResponse.json({ valid: true, message: 'Key format accepted.' });
  } catch (error) {
    console.error('Error validating API key:', error);
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}
