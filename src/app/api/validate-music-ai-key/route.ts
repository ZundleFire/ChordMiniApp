import { NextRequest, NextResponse } from 'next/server';
import { validateAssemblyApiKey } from '@/services/lyrics/assemblyAiService';

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

    const keyLooksValid = /^[a-zA-Z0-9]{32,}$/.test(apiKey) || /^[0-9a-f-]{36}$/i.test(apiKey);
    if (!keyLooksValid) {
      return NextResponse.json(
        { valid: false, error: 'Invalid key format. Please provide a valid AssemblyAI key.' },
        { status: 400 }
      );
    }

    const validation = await validateAssemblyApiKey(apiKey);
    if (!validation.valid) {
      return NextResponse.json({ valid: false, error: validation.error || 'Invalid API key' }, { status: 400 });
    }

    return NextResponse.json({ valid: true, message: 'API key is valid' });
  } catch (error) {
    console.error('Error validating API key:', error);
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}
