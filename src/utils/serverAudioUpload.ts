function hasAsciiPrefix(buffer: Uint8Array, value: string): boolean {
  if (buffer.length < value.length) {
    return false;
  }
  for (let i = 0; i < value.length; i += 1) {
    if (String.fromCharCode(buffer[i]).toLowerCase() !== value[i].toLowerCase()) {
      return false;
    }
  }
  return true;
}

function looksLikeTextErrorPayload(bytes: Uint8Array): boolean {
  const trimmed = bytes.slice(0, 256);
  return hasAsciiPrefix(trimmed, '<!doctype html')
    || hasAsciiPrefix(trimmed, '<html')
    || hasAsciiPrefix(trimmed, '{"error"')
    || hasAsciiPrefix(trimmed, '{"message"')
    || hasAsciiPrefix(trimmed, '<?xml');
}

function isKnownAudioContainer(bytes: Uint8Array): boolean {
  if (bytes.length < 12) {
    return false;
  }

  const isWav =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45;

  const isOgg =
    bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53;

  const isFlac =
    bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43;

  const isMp3Id3 =
    bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;

  const isMp3Frame =
    bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;

  const isMp4M4a =
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;

  const isWebm =
    bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;

  return isWav || isOgg || isFlac || isMp3Id3 || isMp3Frame || isMp4M4a || isWebm;
}

export async function normalizeUploadedAudioFile(file: File): Promise<File> {
  if (!file || file.size === 0) {
    throw new Error('Uploaded audio file is empty');
  }

  const rawBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(rawBuffer);

  if (looksLikeTextErrorPayload(bytes)) {
    throw new Error('Uploaded payload is not audio (received HTML/JSON error payload).');
  }

  const contentType = (file.type || '').toLowerCase();
  const isMediaType =
    contentType.startsWith('audio/')
    || contentType.startsWith('video/')
    || contentType.includes('application/octet-stream');

  if (!isKnownAudioContainer(bytes) && !isMediaType) {
    throw new Error(`Uploaded payload is not a recognized audio container (content-type: ${contentType || 'unknown'})`);
  }

  const safeType = file.type || 'audio/mpeg';
  const safeName = file.name || 'audio-upload.bin';
  return new File([rawBuffer], safeName, { type: safeType });
}
