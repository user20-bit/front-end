import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {clientConfig} from './config.js';

const sourceMode = process.argv.includes('--source');
const directory = new URL(sourceMode ? './src/' : './dist/', import.meta.url);
const config = sourceMode ? clientConfig(`http://localhost:${process.env.PORT || 3001}`) : null;
const files = {'/':['index.html','text/html'],'/style.css':['style.css','text/css'],'/app.js':['app.js','text/javascript'],'/config.js':['config.js','text/javascript']};
createServer(async (request,response) => {
  const path = request.url.split('?')[0];
  const entry = Object.hasOwn(files, path) && files[path];
  if (!entry) return response.writeHead(404).end();
  try {
    const data = sourceMode && path === '/config.js' ? config : await readFile(new URL(entry[0],directory));
    response.writeHead(200,{'content-type':`${entry[1]}; charset=utf-8`,'cache-control':'no-store'}).end(data);
  } catch {
    response.writeHead(500).end(sourceMode ? 'No se pudo leer el archivo fuente' : 'Ejecuta npm run build');
  }
}).listen(5173,'127.0.0.1',() => console.log(`Frontend (${sourceMode ? 'desarrollo' : 'compilado'}): http://127.0.0.1:5173`));
