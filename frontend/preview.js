import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';

const files = {'/':['index.html','text/html'],'/style.css':['style.css','text/css'],'/app.js':['app.js','text/javascript'],'/config.js':['config.js','text/javascript']};
createServer(async (request,response) => {
  const entry = Object.hasOwn(files, request.url) && files[request.url];
  if (!entry) return response.writeHead(404).end();
  try {
    const data = await readFile(new URL(`./dist/${entry[0]}`,import.meta.url));
    response.writeHead(200,{'content-type':`${entry[1]}; charset=utf-8`}).end(data);
  } catch {
    response.writeHead(500).end('Ejecuta npm run build');
  }
}).listen(5173,'127.0.0.1',() => console.log('http://127.0.0.1:5173'));
