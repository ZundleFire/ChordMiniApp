import { NextRequest, NextResponse } from 'next/server';
import { getPythonApiUrl } from '@/config/serverBackend';
import { normalizeUploadedAudioFile } from '@/utils/serverAudioUpload';

/**
 * API route to recognize chords in an audio file using the BTC Pseudo-Label model
 * This proxies the request to the Python backend
 */

// Configure Vercel function timeout (max 300 seconds for Vercel Hobby/Pro plan)
// BTC chord recognition is heavy ML processing that can take several minutes
export const maxDuration = 300; // 5 minutes for ML processing
export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();

    // Optional: lightweight file debug (server-safe)
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const normalizedFile = await normalizeUploadedAudioFile(file);
    console.log(`BTC-PL request: file name=${normalizedFile.name || 'unknown'}, size=${normalizedFile.size}B`);

    // Ensure detector is set for unified backend endpoint
    const backendFormData = new FormData();
    backendFormData.append('file', normalizedFile, normalizedFile.name);
    backendFormData.append('detector', 'btc-pl');
    backendFormData.append('model', 'btc-pl');
    backendFormData.append('chord_dict', 'large_voca');

    // Forward the request to the Python backend unified endpoint
    const backendUrl = getPythonApiUrl();
    const response = await fetch(`${backendUrl}/api/recognize-chords`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BTC PL chord recognition failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Parse the response
    const data = await response.json();

    // Return the response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error recognizing chords with BTC PL:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle timeout errors specifically
    if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      return NextResponse.json(
        {
          success: false,
          error: 'BTC-PL chord recognition processing timeout',
          details: 'The ML processing took longer than the 10-minute limit. This is an internal processing timeout, not an external service issue.',
          suggestion: 'Try using a shorter audio clip (under 5 minutes) or consider splitting longer tracks into smaller segments for analysis.',
          timeoutLimit: '10 minutes (600 seconds)',
          processingType: 'Internal ML Processing'
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error recognizing chords with BTC PL',
      },
      { status: 500 }
    );
  }
}
