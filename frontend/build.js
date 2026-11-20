import {cp, writeFile} from 'node:fs/promises';
import {clientConfig} from './config.js';

const config = clientConfig();
const destination = new URL('./dist/', import.meta.url);
await cp(new URL('./src/', import.meta.url),destination,{recursive:true});
await writeFile(new URL('config.js', destination),config);
console.log('Frontend compilado en frontend/dist/');
