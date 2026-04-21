import { NextRequest, NextResponse } from 'next/server';
import { CustomMusicAiClient } from '@/services/api/customMusicAiClient';

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

    const client = new CustomMusicAiClient({ apiKey, timeout: 30000, retries: 1 });
    const workflows = await client.listWorkflows();

    if (!Array.isArray(workflows) || workflows.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Music.ai key is valid format but no workflows were returned.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true, message: 'Music.ai API key is valid.' });
  } catch (error) {
    console.error('Error validating Music.ai API key:', error);
    const details = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ valid: false, error: details }, { status: 500 });
  }
}
