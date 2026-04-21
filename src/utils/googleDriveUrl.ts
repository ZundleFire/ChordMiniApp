const GOOGLE_DRIVE_HOSTS = new Set([
  'drive.google.com',
  'docs.google.com',
  'www.drive.google.com',
  'www.docs.google.com',
]);

function normalizeInput(input: string): string {
  return input.trim();
}

export function isGoogleDriveUrl(input: string): boolean {
  const value = normalizeInput(input);
  try {
    const parsed = new URL(value);
    return GOOGLE_DRIVE_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function extractGoogleDriveFileId(input: string): string | null {
  const value = normalizeInput(input);

  if (/^[A-Za-z0-9_-]{20,}$/.test(value) && !value.includes('/')) {
    return value;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!GOOGLE_DRIVE_HOSTS.has(hostname)) {
    return null;
  }

  const idFromQuery = parsed.searchParams.get('id');
  if (idFromQuery) {
    return idFromQuery;
  }

  const pathMatch = parsed.pathname.match(/\/file\/d\/([A-Za-z0-9_-]{10,})/);
  if (pathMatch?.[1]) {
    return pathMatch[1];
  }

  const openMatch = parsed.pathname.match(/\/d\/([A-Za-z0-9_-]{10,})/);
  if (openMatch?.[1]) {
    return openMatch[1];
  }

  return null;
}

export function buildGoogleDriveDirectDownloadUrl(input: string): string | null {
  const fileId = extractGoogleDriveFileId(input);
  if (!fileId) {
    return null;
  }

  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
}

export function normalizeGoogleDriveAudioSource(input: string): string {
  const directUrl = buildGoogleDriveDirectDownloadUrl(input);
  return directUrl || normalizeInput(input);
}
