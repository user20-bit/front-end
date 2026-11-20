import { createServer } from 'node:http';
import { catalog } from './catalog.js';

const origins = (process.env.FRONTEND_ORIGINS || '*').split(',').map(origin => origin.trim());
const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

async function readBody(request) {
  let body = '';
  request.setEncoding('utf8');
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > 32768) throw Object.assign(new Error('Cuerpo demasiado grande'), { status: 413 });
  }
  const data = JSON.parse(body);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Objeto JSON requerido');
  return data;
}

createServer(async (request, response) => {
  const origin = request.headers.origin;
  response.setHeader('Vary', 'Origin');
  if (origins.includes('*') || origins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origins.includes('*') ? '*' : origin);
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  const send = (status, data) => {
    response.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    response.end(JSON.stringify(data));
  };
  if (request.method === 'OPTIONS') return response.writeHead(204).end();
  const {pathname,searchParams} = new URL(request.url, 'http://localhost');
  const {method} = request;
  try {
    if (method === 'GET' && pathname === '/api/health') return send(200,{status:'ok',demo:true});
    if (method === 'GET' && pathname === '/api/opportunities') {
      const query = normalize(searchParams.get('q') || '').trim();
      const region = searchParams.get('region');
      const category = searchParams.get('category');
      const items = catalog.filter(item => (!region || item.region === region) && (!category || item.category === category) &&
        query.split(/\s+/).every(word => normalize(`${item.title} ${item.entity} ${item.region} ${item.category}`).includes(word)));
      return send(200,{items,total:items.length,demo:true});
    }
    const match = pathname.match(/^\/api\/opportunities\/([\w-]+)(?:\/(review|draft))?$/);
    if (match) {
      const [,id,action] = match;
      const item = catalog.find(entry => entry.id === id);
      if (!item) return send(404,{error:'Convocatoria no encontrada'});
      if (method === 'GET' && !action) return send(200,item);
      if (method === 'POST' && action) {
        const {profile = {}, evidence = {}} = await readBody(request);
        if (!profile || typeof profile !== 'object' || !evidence || typeof evidence !== 'object') throw new Error('Perfil o evidencias inválidos');
        const requirements = item.requirements.map(requirement => {
          const document = typeof evidence[requirement.id] === 'string' ? evidence[requirement.id].trim() : '';
          return {...requirement,document,status:document ? 'registrado' : 'pendiente'};
        });
        const pending = requirements.filter(requirement => requirement.status === 'pendiente').map(requirement => requirement.title);
        if (action === 'review') return send(200,{requirements,pending});
        const company = typeof profile.company === 'string' ? profile.company.trim() : '';
        const ruc = typeof profile.ruc === 'string' ? profile.ruc.trim() : '';
        return send(200,{text:`BORRADOR DE DEMOSTRACIÓN\n${item.title}\nEntidad: ${item.entity}\nPostor: ${company || '[razón social pendiente]'}\nRUC: ${ruc || '[RUC pendiente]'}\n\nEvidencias declaradas\n${requirements.map(entry => `- ${entry.title}: ${entry.document || '[pendiente]'}`).join('\n')}\n\nRevisar formato vigente, declaraciones y firmas del postor o consorcio antes de presentar.`,pending});
      }
    }
    if (method === 'POST' && pathname === '/api/estimate') {
      const {lines} = await readBody(request);
      if (!Array.isArray(lines) || lines.length > 50) throw new Error('Partidas inválidas');
      const results = lines.map(line => {
        if (!line || typeof line.name !== 'string' || !Number.isFinite(line.quantity) || line.quantity < 0 || line.quantity > 1e7 ||
          (line.unitCost !== null && (!Number.isFinite(line.unitCost) || line.unitCost < 0 || line.unitCost > 1e7))) throw new Error('Cantidad o costo inválidos');
        const cents = line.unitCost === null ? null : Math.round(line.quantity * line.unitCost * 100);
        if (cents !== null && !Number.isSafeInteger(cents)) throw new Error('Subtotal fuera de rango');
        return {name:line.name,subtotal:cents === null ? null : cents / 100};
      });
      const totalCents = results.reduce((total,line) => total + Math.round((line.subtotal ?? 0) * 100),0);
      if (!Number.isSafeInteger(totalCents)) throw new Error('Total fuera de rango');
      return send(200,{lines:results,total:totalCents / 100,pending:results.filter(line => line.subtotal === null).length});
    }
    return send(404,{error:'Ruta no encontrada'});
  } catch (error) {
    if (!response.headersSent) send(error.status || 400,{error:error instanceof SyntaxError ? 'JSON inválido' : error.message});
  }
}).listen(Number(process.env.PORT || 3001), '0.0.0.0', () => console.log(`Radar Público API en puerto ${process.env.PORT || 3001}`));
