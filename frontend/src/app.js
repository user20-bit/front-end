import {apiOrigin} from './config.js';

const main = document.querySelector('#main');
const labels = {explorar:'Convocatorias',guardadas:'Guardadas',perfil:'Perfil de empresa',alertas:'Alertas'};
const get = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(`radar:${key}`)) ?? fallback; }
  catch { return fallback; }
};
const set = (key,value) => localStorage.setItem(`radar:${key}`,JSON.stringify(value));
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money = value => new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',maximumFractionDigits:2}).format(value);
const date = value => new Intl.DateTimeFormat('es-PE',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value));
const field = (title,name,value = '',options = '') => `<label>${title}<input name="${name}" value="${escape(value)}" ${options}></label>`;
const select = (name,title,values) => `<select name="${name}" aria-label="${title}"><option value="">${title}</option>${values.map(value => `<option>${escape(value)}</option>`).join('')}</select>`;

async function api(path,body) {
  const response = await fetch(`${apiOrigin}/api${path}`,{
    signal:AbortSignal.timeout(60000),
    ...(body === undefined ? {} : {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Error en la API');
  return result;
}

function message(target,text,isError = false) {
  target.textContent = text;
  target.classList.toggle('error',isError);
}

function task(form,action) {
  form.addEventListener('submit',async event => {
    event.preventDefault();
    const output = form.querySelector('[role=status]');
    const button = form.querySelector('button[type=submit]');
    button.disabled = true;
    try { await action(new FormData(form),output); }
    catch (error) { message(output,error.message,true); }
    finally { button.disabled = false; }
  });
}

const filters = {q:'',region:'',category:''};
let navigation = 0;

function cards(items) {
  const saved = get('saved',[]);
  return items.map(item => `<article class="card"><div class="card-top"><span class="chip">${escape(item.category)}</span><button class="icon-button" type="button" data-save="${escape(item.id)}" aria-pressed="${saved.includes(item.id)}" aria-label="Guardar ${escape(item.title)}">${saved.includes(item.id) ? '★' : '☆'}</button></div><h3>${escape(item.title)}</h3><p class="muted">${escape(item.entity)} · ${escape(item.region)}</p><div class="card-bottom"><div><strong>${money(item.budget)}</strong><br><small class="muted">Cierre ${date(item.deadline)}</small></div><a class="button" href="#convocatoria/${escape(item.id)}">Ver expediente</a></div></article>`).join('');
}

async function list(page,current) {
  const exploring = page === 'explorar';
  main.innerHTML = `${exploring ? `<section class="hero"><p class="eyebrow">OBSERVATORIO DE CONTRATACIÓN PÚBLICA</p><h1>Encuentra tu próxima<br>oportunidad pública</h1><p>Explora convocatorias en Perú, revisa las bases y prepara la evidencia que necesita tu empresa para postular.</p></section><div class="stats" id="stats"></div>` : '<h1>Convocatorias guardadas</h1>'}
  <section aria-labelledby="listing"><div class="section-head"><h2 id="listing">${exploring ? 'Explorar convocatorias' : 'Tu selección'}</h2><span id="count"></span></div>
  <form class="filters" id="filters" ${exploring ? '' : 'hidden'}><input name="q" aria-label="Buscar convocatorias" placeholder="Buscar por servicio o entidad">${select('region','Todas las regiones',['Arequipa','Cusco','La Libertad','Lima'])}${select('category','Todos los rubros',['Consultoría','Limpieza','Seguridad','Tecnología'])}<button type="submit" class="button primary">Buscar</button></form>
  <p id="list-status" role="status">Cargando convocatorias…</p><div class="cards" id="cards"></div></section>`;
  const form = main.querySelector('#filters');
  const status = main.querySelector('#list-status');
  const grid = main.querySelector('#cards');
  for (const [name,value] of Object.entries(filters)) form.elements[name].value = value;
  let request = 0;
  let items = [];
  let all = [];
  const render = () => {
    const saved = get('saved',[]);
    const visible = exploring ? items : items.filter(item => saved.includes(item.id));
    grid.innerHTML = cards(visible);
    main.querySelector('#count').textContent = `${visible.length} ${visible.length === 1 ? 'resultado' : 'resultados'}`;
    message(status,visible.length ? '' : exploring ? 'No hay convocatorias con esos filtros.' : 'Todavía no tienes convocatorias guardadas.');
    if (exploring) main.querySelector('#stats').innerHTML = [[all.length,'Convocatorias','▤'],[new Set(all.map(item => item.region)).size,'Regiones','◎'],[saved.length,'Guardadas','☆']].map(([count,label,icon]) => `<div class="stat"><span class="tile-icon" aria-hidden="true">${icon}</span><div><b>${count}</b><small>${label}</small></div></div>`).join('');
  };
  async function load() {
    const attempt = ++request;
    message(status,'Cargando convocatorias…');
    try {
      if (!all.length) all = (await api('/opportunities')).items;
      const query = exploring ? new URLSearchParams(filters) : null;
      const result = query && Object.values(filters).some(Boolean) ? (await api(`/opportunities?${query}`)).items : all;
      if (current !== navigation || attempt !== request) return;
      items = result;
      render();
    } catch {
      if (current === navigation && attempt === request) message(status,'No se pudo conectar con la API. Vuelve a intentar con Buscar o recarga la página.',true);
    }
  }
  form.addEventListener('submit',event => {
    event.preventDefault();
    Object.assign(filters,Object.fromEntries(new FormData(form)));
    load();
  });
  grid.addEventListener('click',event => {
    const button = event.target.closest('[data-save]');
    if (!button) return;
    const saved = new Set(get('saved',[]));
    const id = button.dataset.save;
    if (saved.has(id)) saved.delete(id);
    else saved.add(id);
    set('saved',[...saved]);
    render();
    grid.querySelector(`[data-save="${id}"]`)?.focus();
  });
  await load();
}

function settings(page) {
  const previous = get(page,{});
  const profile = page === 'perfil';
  const fields = profile ? [
    field('Razón social','company',previous.company,'required maxlength="120"'),
    field('RUC','ruc',previous.ruc,'inputmode="numeric" pattern="[0-9]{11}" title="11 dígitos"'),
    ...[['Servicios','services'],['Certificaciones y homologaciones','certifications'],['Contratos ejecutados','contracts'],['Personal, experiencia y constancias','staff']].map(([title,key]) => `<label>${title}<textarea name="${key}" maxlength="1500">${escape(previous[key])}</textarea></label>`),
  ] : [
    field('Correo','email',previous.email,'type="email" required maxlength="150"'),
    `<label>Frecuencia<select name="frequency"><option value="inmediata">Al detectar una oportunidad</option><option value="diaria">Diaria</option><option value="semanal">Semanal</option></select></label>`,
    field('Palabras clave','keywords',previous.keywords,'required maxlength="150" placeholder="Ej. limpieza, Lima"'),
  ];
  main.innerHTML = `<h1>${labels[page]}</h1><p class="muted">${profile ? 'Registra las capacidades y evidencias de tu empresa. El perfil se guarda en este navegador.' : 'Guarda tus preferencias en este navegador. El envío de correos está pendiente de integración.'}</p><form class="panel"><div class="fields">${fields.join('')}</div><button type="submit" class="button primary">Guardar ${profile ? 'perfil' : 'preferencias'}</button><div class="feedback" role="status"></div></form>`;
  const form = main.querySelector('form');
  if (!profile && previous.frequency) form.elements.frequency.value = previous.frequency;
  task(form,(values,output) => {
    set(page,Object.fromEntries(values));
    message(output,'Cambios guardados.');
  });
}

function review(item,panel) {
  const evidence = get(`evidence:${item.id}`,{});
  panel.innerHTML = `<h2>Requisitos de las bases</h2><p class="muted">Cláusulas y páginas de ejemplo. Registra el nombre o la referencia de cada documento.</p><form><div class="stack">${item.requirements.map(entry => field(`${escape(entry.title)} · Cláusula ${escape(entry.clause)}, pág. ${entry.page}`,escape(entry.id),evidence[entry.id],'maxlength="200"')).join('')}</div><br><button type="submit" class="button primary">Revisar evidencias</button><div class="feedback" role="status"></div></form>`;
  task(panel.querySelector('form'),async (values,output) => {
    const evidence = Object.fromEntries(values);
    const result = await api(`/opportunities/${item.id}/review`,{evidence});
    set(`evidence:${item.id}`,evidence);
    message(output,result.requirements.map(entry => `${entry.title} · ${entry.status === 'registrado' ? 'Evidencia declarada' : 'Pendiente'}`).join('\n'));
  });
}

function estimate(item,panel) {
  const key = `costs:${item.id}`;
  const defaults = ['Personal','Insumos y equipos','Supervisión y traslados'].map(name => ({name,quantity:1,unitCost:null}));
  panel.innerHTML = `<h2>Viabilidad económica</h2><p class="muted">Alcance de referencia · ${item.sites} sedes · ${item.months} meses. Deja el costo unitario vacío si falta cotizar.</p><form><div id="lines"></div><div class="tabs"><button type="button" class="button" id="add">Añadir partida</button><button type="submit" class="button primary">Calcular total</button></div><div class="feedback" role="status"></div></form>`;
  const form = panel.querySelector('form');
  const lines = panel.querySelector('#lines');
  const add = panel.querySelector('#add');
  function addLine(line) {
    lines.insertAdjacentHTML('beforeend',`<div class="line">${field('Partida','name',line.name,'required maxlength="120"')}${field('Cantidad','quantity',line.quantity,'type="number" min="0" max="10000000" step="any" required')}${field('Costo unitario (S/)','unit',line.unitCost,'type="number" min="0" max="10000000" step="0.01"')}<button type="button" class="icon-button" aria-label="Eliminar partida">×</button></div>`);
    const row = lines.lastElementChild;
    row.querySelector('button').onclick = () => { row.remove(); add.disabled = false; };
    add.disabled = lines.children.length >= 50;
    return row;
  }
  get(key,defaults).forEach(addLine);
  add.onclick = () => addLine({name:'',quantity:1,unitCost:null}).querySelector('input').focus();
  task(form,async (_,output) => {
    const entries = [...lines.children].map(row => {
      const [name,quantity,unit] = row.querySelectorAll('input');
      return {name:name.value,quantity:quantity.valueAsNumber,unitCost:unit.value === '' ? null : unit.valueAsNumber};
    });
    const result = await api('/estimate',{lines:entries});
    set(key,entries);
    message(output,[`Total cotizado: ${money(result.total)} · ${result.pending} sin cotizar`,...result.lines.map(line => `${line.name}: ${line.subtotal === null ? 'Pendiente' : money(line.subtotal)}`)].join('\n'));
  });
}

function history(item,panel) {
  const data = item.history;
  panel.innerHTML = `<h2>Antecedente comparable</h2><p><strong>${escape(data.winner)}</strong> · ${data.bidders} postores</p><p>${money(data.amount)} · ${data.months} meses · ${data.sites} sedes</p><p>${escape(data.evaluation)}</p><p class="muted">${escape(data.source)}. El monto histórico es una referencia de comparación.</p>`;
}

function draft(item,panel) {
  panel.innerHTML = '<h2>Borrador de oferta</h2><p class="muted">Usa el perfil y las evidencias registradas en esta convocatoria.</p><form><button type="submit" class="button primary">Generar borrador</button><div class="feedback" role="status"></div></form><div class="stack" id="draft-output"></div>';
  const area = panel.querySelector('#draft-output');
  task(panel.querySelector('form'),async (_,output) => {
    const result = await api(`/opportunities/${item.id}/draft`,{profile:get('perfil',{}),evidence:get(`evidence:${item.id}`,{})});
    if (!area.isConnected) return;
    area.innerHTML = '<label>Texto del borrador<textarea rows="12"></textarea></label><div><button type="button" class="button">Descargar texto</button></div>';
    const editor = area.querySelector('textarea');
    editor.value = result.text;
    area.querySelector('button').onclick = () => {
      const url = URL.createObjectURL(new Blob([editor.value],{type:'text/plain;charset=utf-8'}));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.id}-borrador.txt`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url),1000);
    };
    message(output,'Borrador generado. Puedes editarlo antes de descargarlo.');
  });
}

async function detail(id,current) {
  main.innerHTML = '<a href="#explorar" class="back">Volver a convocatorias</a><p role="status">Cargando expediente…</p>';
  const item = await api(`/opportunities/${encodeURIComponent(id)}`);
  if (current !== navigation) return;
  main.innerHTML = `<a href="#explorar" class="back">Volver a convocatorias</a><section class="hero"><p class="eyebrow">${escape(item.id)} · ${escape(item.category.toUpperCase())}</p><h1>${escape(item.title)}</h1><p>${escape(item.entity)} · ${escape(item.region)} · Cierre ${date(item.deadline)}</p></section><div class="tabs" aria-label="Secciones del expediente"></div><section class="panel" id="detail-panel"></section>`;
  const tabs = main.querySelector('.tabs');
  const panel = main.querySelector('#detail-panel');
  for (const [label,render] of [['Bases y evidencias',review],['Costos',estimate],['Antecedentes',history],['Oferta',draft]]) {
    const button = document.createElement('button');
    button.className = 'button';
    button.textContent = label;
    button.setAttribute('aria-pressed','false');
    button.onclick = () => {
      for (const tab of tabs.children) tab.setAttribute('aria-pressed',String(tab === button));
      render(item,panel);
    };
    tabs.append(button);
  }
  tabs.firstElementChild.click();
}

async function route() {
  const current = ++navigation;
  const [page,id] = location.hash.slice(1).split('/');
  const active = Object.hasOwn(labels,page) ? page : 'explorar';
  document.querySelector('#breadcrumb').textContent = page === 'convocatoria' ? 'Expediente' : labels[active];
  document.querySelectorAll('[data-page]').forEach(link => {
    if (link.dataset.page === active) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
  window.scrollTo(0,0);
  try {
    if (page === 'convocatoria' && id) await detail(id,current);
    else if (active === 'perfil' || active === 'alertas') settings(active);
    else await list(active,current);
  } catch (error) {
    if (current === navigation) main.innerHTML = `<p class="error" role="status">${escape(error.message)}</p><a class="back" href="#explorar">Volver a convocatorias</a>`;
  }
}

window.addEventListener('hashchange',route);
route();
