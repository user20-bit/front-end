export function clientConfig(defaultOrigin = 'http://localhost:3001') {
  const api = new URL(process.env.PUBLIC_API_URL || defaultOrigin);
  if (!['http:', 'https:'].includes(api.protocol) || api.username || api.password || api.pathname !== '/' || api.search || api.hash) {
    throw new Error('PUBLIC_API_URL debe contener solo el origen HTTP(S) de la API');
  }
  return `export const apiOrigin = ${JSON.stringify(api.origin)};\n`;
}
