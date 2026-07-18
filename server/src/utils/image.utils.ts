export function sanitizeGoogleBooksUrl(rawUrl: string | null): string | null {
  if (!rawUrl) {
    return null;
  }

  return rawUrl.replace(/^http:/, 'https:');
}
