import {cp, writeFile} from 'node:fs/promises';

const api = new URL(process.env.PUBLIC_API_URL || 'http://localhost:3001');
if (!['http:', 'https:'].includes(api.protocol) || api.username || api.password || api.pathname !== '/' || api.search || api.hash) {
  throw new Error('PUBLIC_API_URL debe contener solo el origen HTTP(S) de la API');
}
await cp('src','dist',{recursive:true});
await writeFile('dist/config.js',`export const apiOrigin = ${JSON.stringify(api.origin)};\n`);
