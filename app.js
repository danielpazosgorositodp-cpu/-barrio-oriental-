// Barrio Oriental · lógica de la app
'use strict';
(function () {
const SECS = { barrios: 'Barrios', ronda: 'La Ronda', comercios: 'Comercios', feria: 'La Feria', folklore: 'Cultura' };
const DESC = {
  todo: 'Todo lo que pasa en Uruguay, mezclado y sin burbujas.',
  barrios: 'La vida del barrio: avisos, recomendaciones, mascotas perdidas, fotos de la plaza y lo que pasa en la cuadra.',
  ronda: 'Nuestro espacio de diálogo: charlá de cualquier tema, también de lo que nos divide. Una sola regla: se discuten ideas, no personas.',
  comercios: 'Los comercios y oficios de los vecinos: novedades, ofertas y recomendaciones. Trato directo, sin comisiones.',
  feria: 'Compra, venta y permuta entre vecinos, y lo que llegó a la feria del barrio.',
  folklore: 'Música, teatro, arte, carnaval, danza y nuestras tradiciones. Promocioná tu toque, tu obra o tu taller.'
};
const MVD = ['Aguada','Aires Puros','Atahualpa','Bañados de Carrasco','Barrio Sur','Bella Vista','Belvedere','Brazo Oriental','Buceo','Capurro','Carrasco','Carrasco Norte','Casabó','Casavalle','Centro','Cerrito','Cerro','Ciudad Vieja','Colón','Conciliación','Cordón','Flor de Maroñas','Goes','Ituzaingó','Jacinto Vera','Jardines del Hipódromo','La Blanqueada','La Comercial','La Figurita','La Paloma','La Teja','Larrañaga','Las Acacias','Las Canteras','Lezica','Malvín','Malvín Norte','Manga','Maroñas','Mercado Modelo','Nuevo París','Palermo','Parque Batlle','Parque Rodó','Paso de la Arena','Paso Molino','Peñarol','Piedras Blancas','Pocitos','Prado','Punta Carretas','Punta de Rieles','Punta Gorda','Reducto','Sayago','Tres Cruces','Tres Ombúes','Unión','Villa Española','Villa Muñoz'];
const DEP = ['Artigas','Canelones','Cerro Largo','Colonia','Durazno','Flores','Florida','Lavalleja','Maldonado','Paysandú','Río Negro','Rivera','Rocha','Salto','San José','Soriano','Tacuarembó','Treinta y Tres'];
const MATES = ['Amargo','Dulce','Con yuyos','Team torta frita','Termo bajo el brazo'];

const S = { sb: null, me: null, admin: false, posts: [], coms: [], ceb: [], pas: [], seg: [], reps: [], recl: [], perf: {}, shops: [],
  tab: 'paravos', sec: 'todo', zona: '', view: 'muro', open: new Set(), authTab: 'entrar', installEvt: null, recovery: false };

const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ini = n => (String(n || '?').trim().charAt(0) || '?').toUpperCase();
const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const t = v => typeof v === 'number' ? v : Date.parse(v) || 0;
const hace = v => { const m = Math.round((Date.now() - t(v)) / 6e4); if (m < 1) return 'recién'; if (m < 60) return 'hace ' + m + ' min'; const h = Math.round(m / 60); if (h < 24) return 'hace ' + h + ' h'; const d = Math.round(h / 24); return d === 1 ? 'ayer' : 'hace ' + d + ' días'; };
const zonaOpts = (sel, todo) => (todo !== undefined ? `<option value="">${esc(todo)}</option>` : '') +
  `<optgroup label="Montevideo">${MVD.map(b => `<option${b === sel ? ' selected' : ''}>${b}</option>`).join('')}</optgroup>` +
  `<optgroup label="Interior">${DEP.map(b => `<option${b === sel ? ' selected' : ''}>${b}</option>`).join('')}</optgroup>`;
const waLink = (n, txt) => { let d = String(n || '').replace(/\D/g, ''); if (!d) return ''; if (d.startsWith('0')) d = '598' + d.slice(1); else if (!d.startsWith('598')) d = '598' + d; return 'https://wa.me/' + d + '?text=' + encodeURIComponent(txt); };
const mapLink = (ref, b) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([ref, b, MVD.includes(b) ? 'Montevideo' : '', 'Uruguay'].filter(Boolean).join(', '));
const fotoUrl = p => p ? S.sb.storage.from('fotos').getPublicUrl(p).data.publicUrl : '';
const okUrl = u => /^https:\/\//.test(u);
const ytId = u => { const m = String(u || '').match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; };
const primerUrl = t => { const m = String(t || '').match(/https:\/\/[^\s"'<>]+/); return m ? m[0] : ''; };
function videoHtml(u) {
  if (!okUrl(u)) return '';
  const yt = ytId(u);
  if (yt) return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="Video" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
  const ig = u.match(/instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  if (ig) return `<div class="video vert ig"><iframe src="https://www.instagram.com/${ig[1] === 'p' ? 'p' : 'reel'}/${ig[2]}/embed" title="Video de Instagram" loading="lazy" allowfullscreen></iframe></div>`;
  const tt = u.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tt) return `<div class="video vert tt"><iframe src="https://www.tiktok.com/embed/v2/${tt[1]}" title="Video de TikTok" loading="lazy" allow="encrypted-media; fullscreen" allowfullscreen></iframe></div>`;
  if (/(facebook\.com\/.+\/videos\/|facebook\.com\/(watch|reel)|fb\.watch\/)/.test(u)) return `<div class="video"><iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false" title="Video de Facebook" loading="lazy" allow="encrypted-media; fullscreen" allowfullscreen></iframe></div>`;
  const red = /instagram\.com/.test(u) ? 'Instagram' : /tiktok\.com/.test(u) ? 'TikTok' : /facebook\.com|fb\.watch/.test(u) ? 'Facebook' : 'la web';
  return `<a class="lnk vid" href="${esc(u)}" target="_blank" rel="noopener">▶ Ver el video en ${red}</a>`;
}

const myP = () => S.perf[S.me] || {};
const sigo = uid => S.seg.some(x => x.seguidor === S.me && x.seguido === uid);
const seguidores = uid => S.seg.filter(x => x.seguido === uid).length;
const countBy = arr => { const m = {}; for (const x of arr) m[x.post_id] = (m[x.post_id] || 0) + 1; return m; };
const mine = (arr, id) => arr.some(x => x.post_id === id && x.autor === S.me);
const nombre = uid => uid === S.me ? 'Vos' : ((S.perf[uid] && S.perf[uid].nombre) || 'Vecino');
const autorDe = p => p.ejemplo ? (p.autor_ejemplo || 'Vecino de ejemplo') : (p.autor === S.me ? ((myP().nombre || 'Vos')) : nombre(p.autor));

function msg(txt, ok) { $('#msg').innerHTML = txt ? `<div class="note"${ok ? ' style="background:var(--soft);color:var(--ink)"' : ''}>${txt}</div>` : ''; }
function fail(e) { console.error(e); msg('No se pudo guardar. Revisá la conexión y probá de nuevo.'); }
async function q(p) { const r = await p; if (r.error) throw r.error; return r.data; }

// ---------- Para vos (sin burbujas) y Amigos (cronológico) ----------
function paraVos(list) {
  const now = Date.now(), cm = countBy(S.ceb), bar = myP().barrio;
  const A = list.filter(p => now - t(p.creado) < 3 * 864e5).sort((a, b) => (cm[b.id] || 0) - (cm[a.id] || 0) || t(b.creado) - t(a.creado));
  const B = list.filter(p => !p.ejemplo && seguidores(p.autor) < 3).sort((a, b) => t(b.creado) - t(a.creado));
  const C = list.filter(p => p.barrio !== bar).sort((a, b) => t(b.creado) - t(a.creado));
  const out = [], seen = new Set(), qs = [A, B, C];
  for (let more = true; more;) { more = false; for (const qq of qs) { while (qq.length) { const p = qq.shift(); if (!seen.has(p.id)) { seen.add(p.id); out.push(p); more = true; break; } } } }
  [...list].sort((a, b) => t(b.creado) - t(a.creado)).forEach(p => { if (!seen.has(p.id)) out.push(p); });
  return out;
}
function amigos(list) {
  const ids = new Set(S.seg.filter(x => x.seguidor === S.me).map(x => x.seguido)); ids.add(S.me);
  const byId = Object.fromEntries(list.map(p => [p.id, p])); const items = [];
  list.forEach(p => { if (ids.has(p.autor)) items.push({ p, t: t(p.creado) }); });
  S.pas.forEach(x => { const p = byId[x.post_id]; if (p && ids.has(x.autor) && x.autor !== p.autor) items.push({ p, t: t(x.creado), por: x.autor }); });
  return items.sort((a, b) => b.t - a.t);
}

// ---------- Tarjetas ----------
function postCard(p, por) {
  const cm = countBy(S.ceb), pm = countBy(S.pas), rm = countBy(S.reps);
  const coms = S.coms.filter(c => c.post_id === p.id).sort((a, b) => t(a.creado) - t(b.creado));
  const nm = autorDe(p), h = p.ejemplo ? 205 : hue(p.autor), yo = p.autor === S.me, open = S.open.has(p.id);
  const wa = (p.seccion === 'feria' || p.seccion === 'comercios') && p.whatsapp ? waLink(p.whatsapp, '¡Hola! Te vi en Barrio Oriental: ' + String(p.texto || '').slice(0, 60)) : '';
  const foto = fotoUrl(p.foto);
  const yaRep = S.reps.some(r => r.post_id === p.id && r.autor === S.me);
  return `<article class="card">
  ${por ? `<div class="repost">${esc(nombre(por))} pasó el mate</div>` : ''}
  <div class="who"><div class="av" style="background:hsl(${h} 62% 48%)">${esc(ini(nm))}</div>
   <div class="grow"><b>${esc(nm)}</b><small>${esc(p.barrio || 'Uruguay')} · ${hace(p.creado)}</small></div>
   ${!p.ejemplo && !yo ? `<button class="follow ${sigo(p.autor) ? 'on' : ''}" data-act="seguir" data-v="${esc(p.autor)}">${sigo(p.autor) ? 'Amigos ✓' : '+ Seguir'}</button>` : ''}</div>
  <div style="margin-top:8px"><span class="tag">${esc(SECS[p.seccion] || 'Barrios')}</span>${p.ejemplo ? ' <span class="tag ej">ejemplo</span>' : ''}${S.admin && rm[p.id] ? ` <span class="rep">⚑ ${rm[p.id]} reporte${rm[p.id] > 1 ? 's' : ''}</span>` : ''}</div>
  <p class="txt">${esc(p.texto)}</p>
  ${okUrl(foto) ? `<img class="foto" loading="lazy" alt="Foto de la publicación" src="${esc(foto)}">` : ''}
  ${videoHtml(p.video)}
  ${wa ? `<div style="margin-top:10px"><a class="wa" href="${esc(wa)}" target="_blank" rel="noopener"><svg width="20" height="20"><use href="#i-tel"/></svg>Hablar por WhatsApp</a><div class="num">${esc(p.whatsapp)}</div></div>` : ''}
  <div class="acts">
   <button class="act ${mine(S.ceb, p.id) ? 'on' : ''}" data-act="cebar" data-v="${esc(p.id)}" title="Cebar un mate es como dar me gusta"><svg><use href="#i-mate"/></svg><span class="lbl">${cm[p.id] || 0} ${mine(S.ceb, p.id) ? 'Cebado' : 'Cebar'}<small>(me gusta)</small></span></button>
   <button class="act ${mine(S.pas, p.id) ? 'on' : ''}" data-act="pasar" data-v="${esc(p.id)}" title="Pasar el mate es compartirlo con los que te siguen"><svg><use href="#i-pasar"/></svg><span class="lbl">${pm[p.id] || 0} ${mine(S.pas, p.id) ? 'Pasado' : 'Pasar el mate'}<small>(compartir)</small></span></button>
   <button class="act" data-act="coms" data-v="${esc(p.id)}" aria-label="Comentarios"><svg><use href="#i-com"/></svg>${coms.length}</button>
   ${(yo || S.admin) ? `<button class="del" data-act="borrar" data-v="${esc(p.id)}">Borrar</button>` : (!p.ejemplo ? `<button class="del" data-act="reportar" data-v="${esc(p.id)}">${yaRep ? 'Reportado' : 'Reportar'}</button>` : '')}
  </div>
  ${open ? `<div class="coms">${coms.map(c => `<div class="com"><b>${esc(nombre(c.autor))}</b>${esc(c.texto)}${(c.autor === S.me || S.admin) ? ` <button class="del" data-act="borrarCom" data-v="${esc(c.id)}">borrar</button>` : ''}</div>`).join('') || '<div class="num">Todavía nadie comentó. Arrancá vos.</div>'}
   <form class="row" data-form="com" data-v="${esc(p.id)}"><input name="t" maxlength="300" placeholder="Escribí un comentario" aria-label="Comentario" required><button class="btn">Enviar</button></form></div>` : ''}
  </article>`;
}
const vacio = (a, b) => `<div class="empty"><h3>${a}</h3><p>${b}</p></div>`;

function installBox() {
  if (window.matchMedia('(display-mode: standalone)').matches) return '';
  if (S.installEvt) return `<div class="install"><img src="icono-192.png" alt=""><p><b>Instalá Barrio Oriental</b> en tu teléfono, con su ícono.</p><button class="btn" data-act="instalar">Instalar</button></div>`;
  return '';
}

// ---------- Vistas ----------
function muro() {
  const list = S.posts.filter(p => (S.sec === 'todo' || p.seccion === S.sec) && (!S.zona || p.barrio === S.zona));
  const semana = S.posts.filter(p => Date.now() - t(p.creado) < 7 * 864e5); const cnt = {};
  semana.forEach(p => { if (p.barrio) cnt[p.barrio] = (cnt[p.barrio] || 0) + 1; });
  const mb = myP().barrio; if (mb && !cnt[mb]) cnt[mb] = 0;
  const top = Object.entries(cnt).sort((a, b) => (b[0] === mb) - (a[0] === mb) || b[1] - a[1]).slice(0, 10);
  let html = installBox() + `<div class="bar" role="group" aria-label="Secciones">${[['todo', 'Todo'], ...Object.entries(SECS)].map(([k, v]) => `<button class="pill" data-act="sec" data-v="${k}" aria-pressed="${S.sec === k}">${v}</button>`).join('')}</div>
  <div class="vuelta" aria-label="Hoy en la vuelta"><button class="bub" data-act="zona" data-v="" aria-pressed="${!S.zona}"><i class="iso"><img src="isotipo.png" alt=""></i>Todo Uruguay<small>${semana.length} esta semana</small></button>
  ${top.map(([b, n]) => `<button class="bub" data-act="zona" data-v="${esc(b)}" aria-pressed="${S.zona === b}"><i style="background:linear-gradient(140deg,hsl(${hue(b)} 70% 62%),hsl(${hue(b)} 60% 42%))">${esc(b.split(' ').map(w => w[0]).join('').slice(0, 2))}</i>${esc(b)}<small>${n ? n + (n === 1 ? ' nueva' : ' nuevas') : 'tu barrio'}</small></button>`).join('')}</div>
  <div class="zona"><span>Zona</span><select id="zonaSel" aria-label="Filtrar por barrio o departamento">${zonaOpts(S.zona, 'Todo Uruguay')}</select></div>
  <p class="secdesc"><b>${S.sec === 'todo' ? 'Todo' : esc(SECS[S.sec])}:</b> ${esc(DESC[S.sec])}</p>`;
  if (S.tab === 'paravos') {
    html += `<details class="regla"><summary>¿Cómo se arma Para vos?</summary>Sin burbujas, y a la vista de todos: intercalamos lo más cebado de los últimos 3 días, lo nuevo de vecinos y comercios con pocos seguidores (para que nadie quede invisible) y lo que pasa en otros barrios y departamentos. Nadie paga por aparecer.</details>`;
    html += `<div class="feed">${paraVos(list).map(p => postCard(p)).join('') || vacio('Todavía no hay nada por acá', 'Sé el primero en publicar algo de tu barrio.')}</div>`;
  } else {
    html += `<div class="feed">${amigos(list).map(x => postCard(x.p, x.por)).join('') || vacio('Tu ronda está vacía', 'Tocá “+ Seguir” en cualquier publicación de Para vos y acá vas a ver todo lo que suben, en el orden real.')}</div>`;
  }
  return html;
}

function shopCard(c) {
  const wa = waLink(c.whatsapp, '¡Hola! Te vi en Barrio Oriental 🧉'), foto = fotoUrl(c.foto);
  const gal = (c.fotos || []).map(fotoUrl).filter(okUrl);
  const pedi = S.recl.some(r => r.comercio_id === c.id && r.autor === S.me);
  return `<article class="card shop"><div class="head">${okUrl(foto) ? `<img class="pic" alt="Frente del local" src="${esc(foto)}">` : `<div class="pic">${esc(ini(c.nombre))}</div>`}
  <div><h3>${esc(c.nombre)}</h3><div style="margin-top:4px"><span class="tag">${esc(c.rubro || 'Comercio')}</span> ${c.verificado ? '<span class="ver">✓ Conocido por la comunidad</span>' : ''}</div>
  <div class="num">${esc([c.referencia, c.barrio].filter(Boolean).join(' · '))}</div></div></div>
  ${videoHtml(c.video)}
  ${gal.length ? `<div class="gal" aria-label="Fotos del comercio">${gal.map(u => `<img loading="lazy" alt="Foto del comercio" src="${esc(u)}">`).join('')}</div>` : ''}
  <dl>${c.atiende ? `<dt>Atiende</dt><dd>${esc(c.atiende)}</dd>` : ''}${c.horario ? `<dt>Horario</dt><dd>${esc(c.horario)}</dd>` : ''}${c.entrega ? `<dt>Entrega</dt><dd>${esc(c.entrega)}</dd>` : ''}${c.whatsapp ? `<dt>WhatsApp</dt><dd>${esc(c.whatsapp)}</dd>` : ''}</dl>
  ${c.credito ? `<p class="credito">Presentación: <b>${esc(c.credito)}</b></p>` : ''}
  ${c.pendiente ? '<p class="num">Ficha de arranque: faltan los datos que complete el propio comercio.</p>' : ''}
  <div class="acts">${wa ? `<a class="wa" href="${esc(wa)}" target="_blank" rel="noopener"><svg width="20" height="20"><use href="#i-tel"/></svg>WhatsApp</a>` : ''}
  <a class="lnk" href="${esc(mapLink(c.referencia, c.barrio))}" target="_blank" rel="noopener"><svg width="20" height="20"><use href="#i-pin"/></svg>Cómo llegar</a>
  ${S.admin ? `<button class="act" data-act="verif" data-v="${esc(c.id)}">${c.verificado ? 'Quitar ✓' : 'Marcar conocido'}</button>` : ''}
  ${(S.admin || c.autor === S.me) ? `<button class="act" data-act="editShop" data-v="${esc(c.id)}">Editar</button><button class="del" data-act="borrarShop" data-v="${esc(c.id)}">Borrar</button>` : ''}</div>
  ${!c.autor && !S.admin ? (pedi ? '<p class="num">Pediste ser el dueño de esta ficha. Te avisamos cuando el administrador lo apruebe.</p>' : `<button class="linkbtn" data-act="reclamar" data-v="${esc(c.id)}">¿Es tu comercio? Tocá acá para administrar esta ficha</button>`) : ''}</article>`;
}
function vidriera() {
  const list = S.shops.filter(c => !S.zona || c.barrio === S.zona).sort((a, b) => (b.verificado ? 1 : 0) - (a.verificado ? 1 : 0) || String(a.nombre).localeCompare(String(b.nombre)));
  return `<div class="sec-h"><h2>Barrios Orientales</h2><p>Los comercios de los vecinos. Sin carrito y sin comisión: hablás directo con quien atiende.</p></div>
  <div class="zona"><span>Zona</span><select id="zonaSel" aria-label="Filtrar por barrio">${zonaOpts(S.zona, 'Todo Uruguay')}</select></div>
  <div style="padding:10px 14px 0"><button class="btn" data-act="nuevoShop">Sumar un comercio del barrio</button></div>
  <div class="feed">${list.map(shopCard).join('') || vacio('Todavía no hay comercios en esta zona', 'Sumá el almacén, la panadería o el taller de tu cuadra.')}</div>`;
}

function idea() {
  return `<article class="idea"><img class="iso" src="isotipo.png" alt="Isotipo de Barrio Oriental" width="560" height="358"><h2>¿Por qué Barrio Oriental?</h2>
  <div class="compare"><div><b>3.452.460</b><span>personas en Chaoyang, un solo distrito de Pekín</span></div><div><b>3.499.451</b><span>personas en todo Uruguay</span></div></div>
  <p>En Pekín hay un solo distrito, Chaoyang, donde viven unos tres millones y medio de personas: casi la misma gente que en todo Uruguay. Y entran en un pedazo de tierra un poco más chico que el departamento de Montevideo. Allá, eso es una zona de la ciudad. Acá, es un país entero.</p>
  <p>Y hay otra coincidencia linda: ellos son orientales porque viven en el Oriente del mundo; nosotros, porque nacimos al oriente del río Uruguay. Orientales de los dos lados del planeta. La diferencia es que allá tres millones y medio son un distrito, y acá pueden volver a ser un barrio.</p>
  <p>Queremos volver al barrio de siempre: las sillas en la vereda, el almacenero que te conocía por el nombre, los vecinos que se cuidaban los gurises, el mate que pasaba de mano en mano aunque cada uno pensara distinto.</p>
  <p>Hoy las aplicaciones de afuera se quedan con hasta un 30% de lo que compramos, nos alejan de quien realmente vende y nos encierran en burbujas que deciden qué vemos. Barrio Oriental hace lo contrario: te muestra al vecino, al comercio de la vuelta y a la gente de todo el país, y te pone a un toque de hablar directo con ellos. Sin intermediarios, sin comisiones, sin algoritmos que te escondan a nadie.</p>
  <p>Pero Barrio Oriental no es solo para comprar y vender. Es para encontrarnos: para compartir lo que somos, nuestras costumbres, nuestros valores y lo que cada uno cree, de Bella Unión al Chuy, de Montevideo al último pueblo del interior.</p>
  <p>Y como en toda ronda de mate, no hace falta pensar igual para sentarse juntos. En La Ronda, nuestro espacio de diálogo, se puede hablar de todo: de lo que nos une y de lo que nos separa. Con respeto, escuchando al otro y discutiendo ideas, no personas. Porque un barrio de verdad no es el que piensa igual, sino el que sabe convivir con sus diferencias.</p>
  <p>Somos pocos, y esa es nuestra fuerza: todos estamos a un “Bo!” de distancia.</p>
  <p class="cierre">Barrio Oriental. Tres millones y medio de vecinos, un solo barrio.</p>
  <p class="datos">Datos: Chaoyang, 3.452.460 habitantes y 470,8 km² (censo de China, 2020). Uruguay, 3.499.451 habitantes (Censo 2023, INE, resultados finales). Departamento de Montevideo, 530 km².</p>
  ${S.me ? '<button class="btn" data-act="view" data-v="muro">Entrar al barrio</button>' : ''}</article>`;
}

function admin() {
  if (!S.admin) return vacio('Solo para administradores', '');
  const rm = countBy(S.reps), rep = S.posts.filter(p => rm[p.id]).sort((a, b) => rm[b.id] - rm[a.id]);
  const shop = id => S.shops.find(c => c.id === id) || {};
  const vecinos = Object.values(S.perf).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
  const npub = uid => S.posts.filter(p => p.autor === uid).length;
  return `<div class="sec-h"><h2>Administración</h2><p>Lo que necesita tu mirada. Solo lo ven los administradores.</p></div>
  <h3 class="adm-h">Pedidos de comercios <span>${S.recl.length}</span></h3>
  <div class="feed">${S.recl.map(r => `<div class="card"><b>${esc(nombre(r.autor))}</b> pide administrar <b>${esc(shop(r.comercio_id).nombre || 'un comercio')}</b>
    <div class="num">${hace(r.creado)}${r.mensaje ? ' · “' + esc(r.mensaje) + '”' : ''}</div>
    <div class="acts"><button class="btn" data-act="aprobar" data-v="${esc(r.id)}">Aprobar</button><button class="btn alt" data-act="rechazar" data-v="${esc(r.id)}">Rechazar</button></div></div>`).join('') || '<p class="num" style="padding:0 4px">No hay pedidos pendientes.</p>'}</div>
  <h3 class="adm-h">Publicaciones reportadas <span>${rep.length}</span></h3>
  <div class="feed">${rep.map(p => postCard(p) + `<button class="btn alt" style="margin-top:-6px" data-act="descartar" data-v="${esc(p.id)}">Está bien: descartar reportes</button>`).join('') || '<p class="num" style="padding:0 4px">Nadie reportó nada. ¡Buen barrio!</p>'}</div>
  <h3 class="adm-h">Vecinos registrados <span>${vecinos.length}</span></h3>
  <div class="card" style="margin:0 12px 12px"><ul class="vec">${vecinos.map(v => `<li><b>${esc(v.nombre)}</b><span>${esc(v.barrio || 'sin barrio')} · ${npub(v.id)} publ.</span></li>`).join('')}</ul></div>`;
}
const pendientesAdmin = () => S.recl.length + new Set(S.reps.map(r => r.post_id)).size;

function perfil() {
  const p = myP(), nm = p.nombre || 'Vos', mis = S.posts.filter(x => x.autor === S.me).sort((a, b) => t(b.creado) - t(a.creado));
  return `<div class="prof"><div class="av" style="background:hsl(${hue(S.me || 'x')} 62% 48%)">${esc(ini(nm))}</div><h2>${esc(nm)}</h2>
  <div class="num">${esc(p.barrio || 'Elegí tu barrio abajo')}${p.mate ? ' · Mate ' + esc(p.mate.toLowerCase()) : ''}${S.admin ? ' · Administrador' : ''}</div>
  <div class="stats"><div><b>${mis.length}</b><span>publicaciones</span></div><div><b>${S.seg.filter(x => x.seguidor === S.me).length}</b><span>seguís</span></div><div><b>${seguidores(S.me)}</b><span>te siguen</span></div></div></div>
  ${installBox()}
  <form class="card" style="margin:0 12px" data-form="perfil"><label for="pn"><b>Mi nombre</b></label><input id="pn" name="nombre" maxlength="60" required value="${esc(p.nombre)}">
  <label for="pb" style="display:block;margin-top:10px"><b>Mi barrio</b></label><select id="pb" name="barrio">${zonaOpts(p.barrio, 'Elegí…')}</select>
  <label for="pm" style="display:block;margin-top:10px"><b>¿Cómo tomás el mate?</b></label><select id="pm" name="mate"><option value="">—</option>${MATES.map(m => `<option${m === p.mate ? ' selected' : ''}>${m}</option>`).join('')}</select>
  <div style="margin-top:12px"><button class="btn">Guardar</button></div></form>
  ${S.admin ? `<div style="padding:12px 12px 0"><button class="btn" data-act="view" data-v="admin" style="width:100%">Panel de administración${pendientesAdmin() ? ' · ' + pendientesAdmin() + ' pendiente' + (pendientesAdmin() > 1 ? 's' : '') : ''}</button></div>` : ''}
  <div style="padding:10px 14px"><button class="linkbtn" data-act="salir">Cerrar sesión</button></div>
  <div class="feed">${mis.map(x => postCard(x)).join('')}</div>`;
}

function auth() {
  if (S.recovery) return `<div class="auth"><div class="card"><h2>Nueva contraseña</h2><form data-form="nuevaClave">
   <label for="np">Elegí una contraseña nueva</label><input id="np" name="clave" type="password" minlength="6" required autocomplete="new-password">
   <div style="margin-top:14px"><button class="btn">Guardar</button></div><div id="authMsg"></div></form></div></div>`;
  const e = S.authTab === 'entrar';
  return `<div class="auth"><div class="card"><h2>${e ? 'Entrá al barrio' : 'Sumate al barrio'}</h2>
  <div class="tabs"><button data-act="authTab" data-v="entrar" aria-pressed="${e}">Entrar</button><button data-act="authTab" data-v="crear" aria-pressed="${!e}">Crear cuenta</button></div>
  <form data-form="${e ? 'entrar' : 'crear'}">
  ${e ? '' : `<label for="an">Tu nombre</label><input id="an" name="nombre" maxlength="60" required autocomplete="name">
  <label for="ab">Tu barrio o departamento</label><select id="ab" name="barrio" required>${zonaOpts('', 'Elegí…')}</select>`}
  <label for="ae">Correo electrónico</label><input id="ae" name="email" type="email" required autocomplete="email" inputmode="email">
  <label for="ac">Contraseña</label><input id="ac" name="clave" type="password" minlength="6" required autocomplete="${e ? 'current-password' : 'new-password'}">
  <div style="margin-top:14px"><button class="btn">${e ? 'Entrar' : 'Crear mi cuenta'}</button></div>
  ${e ? '<button type="button" class="linkbtn" data-act="olvide">Me olvidé la contraseña</button>' : ''}
  <div id="authMsg"></div></form></div>
  <div style="margin-top:16px">${installBox()}</div>
  <p class="num" style="text-align:center">Barrio Oriental está en prueba entre familia y amigos.</p></div>`;
}

function render() {
  const main = $('#main'), y = scrollY, f = document.activeElement;
  const keep = f && f.form && f.form.dataset.form === 'com' ? { v: f.form.dataset.v, t: f.value } : null;
  document.body.classList.toggle('sin-sesion', !S.me);
  document.querySelectorAll('nav.bottom [data-act=view]').forEach(b => b.setAttribute('aria-current', String(b.dataset.v === S.view || (S.view === 'admin' && b.dataset.v === 'perfil'))));
  document.querySelectorAll('#seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === S.tab)));
  $('#seg').style.display = S.me && S.view === 'muro' ? '' : 'none';
  $('#frase').style.display = S.me && S.view === 'muro' ? '' : 'none';
  if (!S.me) { main.innerHTML = S.view === 'idea' ? idea() : auth(); return; }
  main.innerHTML = S.view === 'muro' ? muro() : S.view === 'vidriera' ? vidriera() : S.view === 'idea' ? idea() : S.view === 'admin' ? admin() : perfil();
  if (keep) { const inp = main.querySelector(`form[data-form=com][data-v="${CSS.escape(keep.v)}"] input`); if (inp) { inp.value = keep.t; inp.focus(); } }
  scrollTo(0, y);
}

// ---------- Datos ----------
let cargando = null, otra = false;
async function cargar() {
  if (cargando) { otra = true; return cargando; }
  cargando = (async () => {
    try {
      const sb = S.sb;
      const [posts, coms, ceb, pas, perf, seg, shops, reps, adm] = await Promise.all([
        q(sb.from('posts').select('*').order('creado', { ascending: false }).limit(400)),
        q(sb.from('comentarios').select('*').order('creado', { ascending: true }).limit(3000)),
        q(sb.from('cebadas').select('post_id,autor')),
        q(sb.from('pasadas').select('post_id,autor,creado')),
        q(sb.from('perfiles').select('id,nombre,barrio,mate')),
        q(sb.from('seguimientos').select('seguidor,seguido')),
        q(sb.from('comercios').select('*')),
        q(sb.from('reportes').select('post_id,autor')),
        q(sb.rpc('es_admin'))
      ]);
      let recl = [];
      try { recl = await q(sb.from('reclamos').select('*').order('creado', { ascending: true })); } catch (e) { /* falta la actualización 002 */ }
      Object.assign(S, { posts, coms, ceb, pas, seg, shops, reps, recl, admin: !!adm, perf: Object.fromEntries(perf.map(p => [p.id, p])) });
      if ($('#msg').textContent.includes('conectar')) msg('');
    } catch (e) { console.error(e); msg('No pudimos conectar con el barrio. Revisá tu conexión.'); }
    render();
  })();
  await cargando; cargando = null;
  if (otra) { otra = false; cargar(); }
}
let timer = null;
const recargar = () => { clearTimeout(timer); timer = setTimeout(cargar, 500); };

async function comprimir(file) {
  const img = await createImageBitmap(file); const k = Math.min(1, 1280 / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
}
async function subirFoto(input) {
  const grupo = input && input.closest('.fotobtns');
  const elegido = grupo ? [...grupo.querySelectorAll('input[type=file]')].find(i => i.files && i.files[0]) : input;
  const f = elegido && elegido.files && elegido.files[0]; if (!f) return '';
  const blob = await comprimir(f); const path = `${S.me}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  await q(S.sb.storage.from('fotos').upload(path, blob, { contentType: 'image/jpeg' }));
  return path;
}
async function subirGaleria(input) {
  const fs = input && input.files ? [...input.files].slice(0, 4) : []; const out = [];
  for (const f of fs) { const blob = await comprimir(f); const path = `${S.me}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`; await q(S.sb.storage.from('fotos').upload(path, blob, { contentType: 'image/jpeg' })); out.push(path); }
  return out;
}
const borrarFoto = p => { if (p) S.sb.storage.from('fotos').remove([p]).catch(() => {}); };

// ---------- Hojas (formularios) ----------
// ---------- Botón "atrás" de Android ----------
let hojaEnHist = false;
function irA(v) {
  if (v === S.view) { scrollTo(0, 0); return; }
  S.view = v; history.pushState({ v }, ''); render(); scrollTo(0, 0);
}
function ocultarHoja() { $('#ov').classList.remove('show'); $('#sheet').innerHTML = ''; }
window.addEventListener('popstate', e => {
  if ($('#ov').classList.contains('show')) { hojaEnHist = false; ocultarHoja(); return; }
  const v = (e.state && e.state.v) || 'muro';
  if (v !== S.view) { S.view = v; render(); scrollTo(0, 0); }
});
history.replaceState({ v: 'muro' }, '');
function abrir(html) {
  if (!hojaEnHist) { history.pushState({ v: S.view, hoja: 1 }, ''); hojaEnHist = true; }
  $('#sheet').innerHTML = html; $('#ov').classList.add('show'); const i = $('#sheet').querySelector('textarea,input,select'); if (i) i.focus(); }
function cerrar() {
  ocultarHoja();
  if (!hojaEnHist) return Promise.resolve();
  hojaEnHist = false;
  return new Promise(r => { let hecho = false; const f = () => { if (hecho) return; hecho = true; window.removeEventListener('popstate', f); r(); }; window.addEventListener('popstate', f); history.back(); setTimeout(f, 500); });
}
const fotoBtns = n => `<div class="fotobtns" data-grupo="${n}">
  <label class="filebtn"><input type="file" name="${n}" accept="image/*" capture="environment"><svg width="22" height="22"><use href="#i-cam"/></svg>Sacar foto</label>
  <label class="filebtn"><input type="file" name="${n}" accept="image/*"><svg width="22" height="22"><use href="#i-gal"/></svg>Elegir del celular</label>
  </div><div class="prevbox" hidden><img class="prev" alt="Vista previa de la foto"><button type="button" class="del" data-act="quitarFoto">Quitar foto</button></div>`;
function formPost(pre) {
  pre = pre || {};
  const b = myP().barrio || '';
  abrir(`<h2>Publicar en el barrio</h2><form data-form="post">
  <label>¿En qué sección?</label><div class="secopts">${Object.entries(SECS).map(([k, v], i) => `<label class="secopt"><input type="radio" name="sec" value="${k}" ${(S.sec === k || (S.sec === 'todo' && i === 0)) ? 'checked' : ''}><span><b>${v}</b><small>${esc(DESC[k])}</small></span></label>`).join('')}</div>
  <label for="fz">Zona</label><select id="fz" name="barrio" required>${zonaOpts(b, b ? undefined : 'Elegí tu barrio o departamento')}</select>
  <label for="ft">¿Qué querés contar?</label><textarea id="ft" name="texto" rows="4" maxlength="500" required placeholder="Una recomendación, algo que vendés, una foto de la plaza, una receta…">${esc(pre.texto || '')}</textarea><div class="hint">Hasta 500 caracteres.</div>
  <label>Foto (opcional)</label>${fotoBtns('foto')}<div class="hint">La achicamos antes de subirla.</div>
  <label for="fv">Video (opcional)</label><div class="row"><input id="fv" name="video" type="url" inputmode="url" maxlength="300" placeholder="Enlace de Instagram, TikTok, YouTube o Facebook" value="${esc(pre.video || '')}"><button type="button" class="btn alt" data-act="pegarVideo">Pegar</button></div>
  <div class="hint">Más fácil: en Instagram, TikTok, YouTube o Facebook tocá <b>Compartir → Barrio Oriental</b> y el video llega solo acá.</div>
  <label for="fw">WhatsApp para contacto (opcional)</label><input id="fw" name="wa" inputmode="tel" placeholder="099 123 456"><div class="hint">Se muestra en La Feria y Comercios, para que te escriban directo.</div>
  <div class="row" style="margin-top:16px"><button class="btn" type="submit">Publicar</button><button class="btn alt" type="button" data-act="cerrar">Cancelar</button></div></form>`);
}
function formShop(c) {
  c = c || {};
  abrir(`<h2>${c.id ? 'Editar comercio' : 'Sumar un comercio'}</h2><form data-form="shop" data-v="${esc(c.id || '')}">
  <label for="sn">Nombre</label><input id="sn" name="nombre" required maxlength="60" value="${esc(c.nombre)}">
  <label for="sr">Rubro</label><input id="sr" name="rubro" maxlength="60" placeholder="Almacén, panadería, taller…" value="${esc(c.rubro)}">
  <label for="sb">Barrio</label><select id="sb" name="barrio" required>${zonaOpts(c.barrio || myP().barrio, 'Elegí…')}</select>
  <label for="sf">Referencia</label><input id="sf" name="referencia" maxlength="80" placeholder="Esquina o calle de referencia" value="${esc(c.referencia)}">
  <label for="sa">Quién atiende</label><input id="sa" name="atiende" maxlength="60" placeholder="Atendido por sus dueños" value="${esc(c.atiende)}">
  <label for="sh">Horario</label><input id="sh" name="horario" maxlength="80" value="${esc(c.horario)}">
  <label for="se">Entrega</label><select id="se" name="entrega">${['', 'Retiro en el local', 'Cadete propio', 'Coordinar por WhatsApp'].map(o => `<option${o === (c.entrega || '') ? ' selected' : ''}>${o}</option>`).join('')}</select>
  <label for="sw">WhatsApp</label><input id="sw" name="wa" inputmode="tel" maxlength="30" value="${esc(c.whatsapp)}">
  <label>Foto principal (el frente o quien atiende)</label>${fotoBtns('foto')}
  <label for="sg">Galería: hasta 4 fotos más</label><input id="sg" type="file" name="galeria" accept="image/*" multiple>
  <div class="hint">${(c.fotos || []).length ? 'Ya tiene ' + c.fotos.length + ' foto(s). Si elegís nuevas, reemplazan a las anteriores.' : 'Mostrá los productos, el local, la gente.'}</div>
  <label for="sv">Video (opcional)</label><input id="sv" name="video" type="url" inputmode="url" maxlength="300" placeholder="Enlace de YouTube, Instagram o TikTok" value="${esc(c.video)}">
  <div class="hint">Los de YouTube se ven dentro de la ficha; los demás abren en su app.</div>
  ${S.admin ? `<label for="sc">Crédito de la presentación (solo admin)</label><input id="sc" name="credito" maxlength="80" list="creditos" placeholder="Ej.: La Pari Producciones" value="${esc(c.credito)}"><datalist id="creditos"><option value="La Pari Producciones"></datalist>` : ''}
  <div class="row" style="margin-top:16px"><button class="btn" type="submit">Guardar</button><button class="btn alt" type="button" data-act="cerrar">Cancelar</button></div></form>`);
}

// ---------- Eventos ----------
const confirmar = (b, txt) => { if (b.dataset.ok) return true; b.dataset.ok = '1'; b.textContent = txt || '¿Seguro? Tocá de nuevo'; return false; };
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, v = b.dataset.v, sb = S.sb;
  if (a === 'tab') { S.tab = v; if (S.view !== 'muro') irA('muro'); else { render(); scrollTo(0, 0); } return; }
  if (a === 'view') { irA(v); return; }
  if (a === 'sec') { S.sec = v; render(); return; }
  if (a === 'zona') { S.zona = v; render(); return; }
  if (a === 'coms') { S.open.has(v) ? S.open.delete(v) : S.open.add(v); render(); return; }
  if (a === 'cerrar') { cerrar(); return; }
  if (a === 'pegarVideo') { try { const tx = await navigator.clipboard.readText(); const u = primerUrl(tx); const i = $('#fv'); if (i) i.value = u || tx.trim(); } catch (err) { msg('No pude leer lo copiado: mantené apretado el casillero y elegí “Pegar”.', true); } return; }
  if (a === 'quitarFoto') { const box = b.closest('.prevbox'), grupo = box.previousElementSibling; grupo.querySelectorAll('input[type=file]').forEach(i => { i.value = ''; }); box.hidden = true; return; }
  if (a === 'authTab') { S.authTab = v; render(); return; }
  if (a === 'instalar' && S.installEvt) { S.installEvt.prompt(); try { await S.installEvt.userChoice; } catch (err) {} S.installEvt = null; render(); return; }
  if (a === 'olvide') {
    const em = ($('#ae') || {}).value || '';
    if (!em) { $('#authMsg').innerHTML = '<div class="err">Escribí tu correo arriba y tocá de nuevo.</div>'; return; }
    try { await q(sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + location.pathname })); $('#authMsg').innerHTML = '<div class="ok">Te mandamos un correo para elegir una contraseña nueva.</div>'; }
    catch (err) { $('#authMsg').innerHTML = '<div class="err">No pudimos mandar el correo. Revisá la dirección.</div>'; }
    return;
  }
  if (!S.me) return;
  if (a === 'nuevo') { if (!myP().barrio) msg('Tip: elegí tu barrio en “Mi perfil” para que se cargue solo.', true); formPost(); return; }
  if (a === 'nuevoShop') { formShop(); return; }
  if (a === 'editShop') { formShop(S.shops.find(c => c.id === v)); return; }
  if (a === 'reclamar') {
    const c = S.shops.find(x => x.id === v) || {};
    abrir(`<h2>¿Es tu comercio?</h2><p>Pedí administrar la ficha de <b>${esc(c.nombre)}</b>. Cuando el administrador lo apruebe, vas a poder cargar el WhatsApp, el horario, las fotos y el video.</p>
    <form data-form="reclamo" data-v="${esc(v)}"><label for="rm">Un mensaje para el administrador (opcional)</label><textarea id="rm" name="mensaje" rows="3" maxlength="300" placeholder="Por ejemplo: soy el dueño y atiendo de mañana"></textarea>
    <div class="row" style="margin-top:16px"><button class="btn" type="submit">Enviar pedido</button><button class="btn alt" type="button" data-act="cerrar">Cancelar</button></div></form>`);
    return;
  }
  try {
    if (a === 'cebar' || a === 'pasar') {
      // Se marca al instante y se guarda por detrás; si falla, se deshace.
      const tabla = a === 'cebar' ? 'cebadas' : 'pasadas', key = a === 'cebar' ? 'ceb' : 'pas', prev = S[key], ya = mine(prev, v);
      S[key] = ya ? prev.filter(x => !(x.post_id === v && x.autor === S.me)) : [...prev, { post_id: v, autor: S.me, creado: new Date().toISOString() }];
      render();
      if (a === 'pasar' && !ya) msg('Pasaste el mate: ahora le aparece a los que te siguen, en su pestaña Amigos.', true);
      try {
        if (ya) await q(sb.from(tabla).delete().eq('post_id', v).eq('autor', S.me));
        else await q(sb.from(tabla).insert({ post_id: v, autor: S.me }));
      } catch (err) { S[key] = prev; render(); throw err; }
      return;
    }
    if (a === 'seguir') {
      const prev = S.seg, ya = sigo(v);
      S.seg = ya ? prev.filter(x => !(x.seguidor === S.me && x.seguido === v)) : [...prev, { seguidor: S.me, seguido: v }];
      render();
      try {
        if (ya) await q(sb.from('seguimientos').delete().eq('seguidor', S.me).eq('seguido', v));
        else await q(sb.from('seguimientos').insert({ seguidor: S.me, seguido: v }));
      } catch (err) { S.seg = prev; render(); throw err; }
      return;
    }
    if (a === 'borrar') { if (!confirmar(b)) return; const p = S.posts.find(x => x.id === v); await q(sb.from('posts').delete().eq('id', v)); if (p) borrarFoto(p.foto); }
    if (a === 'borrarCom') { if (!confirmar(b, '¿Borrar?')) return; await q(sb.from('comentarios').delete().eq('id', v)); }
    if (a === 'borrarShop') { if (!confirmar(b)) return; const c = S.shops.find(x => x.id === v); await q(sb.from('comercios').delete().eq('id', v)); if (c) borrarFoto(c.foto); }
    if (a === 'verif') { const c = S.shops.find(x => x.id === v); await q(sb.from('comercios').update({ verificado: !c.verificado }).eq('id', v)); }
    if (a === 'reportar') {
      if (S.reps.some(r => r.post_id === v && r.autor === S.me)) return;
      if (!confirmar(b, '¿Reportar? Tocá de nuevo')) return;
      await q(sb.from('reportes').insert({ post_id: v, autor: S.me })); msg('Gracias. Lo va a revisar quien administra el barrio.', true);
    }
    if (a === 'aprobar') { await q(sb.rpc('aprobar_reclamo', { p_id: v })); msg('Listo: el comercio ya tiene dueño y lo puede editar.', true); }
    if (a === 'rechazar') { if (!confirmar(b, '¿Rechazar?')) return; await q(sb.from('reclamos').delete().eq('id', v)); }
    if (a === 'descartar') { await q(sb.from('reportes').delete().eq('post_id', v)); }
    if (a === 'salir') { await sb.auth.signOut(); return; }
    await cargar();
  } catch (err) { fail(err); }
});
$('#ov').addEventListener('click', e => { if (e.target.id === 'ov') cerrar(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
document.addEventListener('change', e => {
  if (e.target.id === 'zonaSel') { S.zona = e.target.value; render(); return; }
  const grupo = e.target.closest && e.target.closest('.fotobtns');
  if (grupo && e.target.files && e.target.files[0]) {
    grupo.querySelectorAll('input[type=file]').forEach(i => { if (i !== e.target) i.value = ''; });
    const box = grupo.nextElementSibling, img = box.querySelector('img');
    if (img.src) URL.revokeObjectURL(img.src);
    img.src = URL.createObjectURL(e.target.files[0]); box.hidden = false;
  }
});

document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
  const k = f.dataset.form, fd = new FormData(f), sb = S.sb, btn = f.querySelector('button:not([type=button])');
  const txt = n => String(fd.get(n) || '').trim();
  const authMsg = (h) => { const m = f.querySelector('#authMsg'); if (m) m.innerHTML = h; };
  if (btn) { btn.disabled = true; btn.dataset.t = btn.textContent; btn.textContent = 'Un momento…'; }
  try {
    if (k === 'entrar') {
      const r = await sb.auth.signInWithPassword({ email: txt('email'), password: String(fd.get('clave')) });
      if (r.error) throw { auth: r.error.message.includes('confirm') ? 'Tenés que confirmar tu correo primero: revisá tu bandeja de entrada.' : 'Correo o contraseña incorrectos.' };
    }
    if (k === 'crear') {
      const r = await sb.auth.signUp({ email: txt('email'), password: String(fd.get('clave')), options: { data: { nombre: txt('nombre'), barrio: txt('barrio') }, emailRedirectTo: location.origin + location.pathname } });
      if (r.error) throw { auth: r.error.message.includes('registered') ? 'Ese correo ya tiene cuenta: usá “Entrar”.' : 'No pudimos crear la cuenta: ' + r.error.message };
      if (!r.data.session) authMsg('<div class="ok">¡Listo! Te mandamos un correo para confirmar la cuenta. Después volvé y tocá “Entrar”.</div>');
    }
    if (k === 'nuevaClave') { await q(sb.auth.updateUser({ password: String(fd.get('clave')) })); S.recovery = false; msg('Contraseña cambiada.', true); const r = await sb.auth.getSession(); await conSesion(r.data.session); }
    if (k === 'reclamo') { await q(sb.from('reclamos').insert({ comercio_id: f.dataset.v, autor: S.me, mensaje: txt('mensaje') })); cerrar(); msg('Pedido enviado. Te avisamos cuando lo aprueben.', true); await cargar(); }
    if (k === 'com') { const tt = txt('t'); if (tt) { const nuevo = await q(sb.from('comentarios').insert({ post_id: f.dataset.v, autor: S.me, texto: tt }).select().single()); S.coms = [...S.coms, nuevo]; f.reset(); render(); } }
    if (k === 'perfil') { await q(sb.from('perfiles').update({ nombre: txt('nombre') || 'Vecino', barrio: txt('barrio'), mate: txt('mate') }).eq('id', S.me)); msg('Perfil guardado.', true); await cargar(); }
    if (k === 'post') {
      const foto = await subirFoto(f.querySelector('[name=foto]'));
      const vid = primerUrl(txt('video'));
      await q(sb.from('posts').insert({ autor: S.me, seccion: txt('sec'), barrio: txt('barrio'), texto: txt('texto'), whatsapp: txt('wa'), foto, ...(vid ? { video: vid } : {}) }));
      await cerrar(); Object.assign(S, { tab: 'paravos', sec: 'todo', zona: '' }); if (S.view !== 'muro') irA('muro'); msg(''); scrollTo(0, 0); await cargar();
    }
    if (k === 'shop') {
      const id = f.dataset.v, old = S.shops.find(c => c.id === id) || {};
      const foto = await subirFoto(f.querySelector('[name=foto]'));
      const gal = await subirGaleria(f.querySelector('[name=galeria]'));
      const vid = txt('video');
      const data = { video: /^https:\/\//.test(vid) ? vid : '', ...(gal.length ? { fotos: gal } : {}), ...(S.admin ? { credito: txt('credito') } : {}), nombre: txt('nombre'), rubro: txt('rubro'), barrio: txt('barrio'), referencia: txt('referencia'), atiende: txt('atiende'), horario: txt('horario'), entrega: txt('entrega'), whatsapp: txt('wa'), foto: foto || old.foto || '', pendiente: false };
      if (id) await q(sb.from('comercios').update(data).eq('id', id));
      else await q(sb.from('comercios').insert({ ...data, autor: S.me }));
      if (foto && old.foto) borrarFoto(old.foto);
      if (gal.length) (old.fotos || []).forEach(borrarFoto);
      cerrar(); await cargar();
    }
  } catch (err) {
    if (err && err.auth) authMsg(`<div class="err">${esc(err.auth)}</div>`); else fail(err);
  }
  if (btn && btn.isConnected) { btn.disabled = false; btn.textContent = btn.dataset.t; }
});

window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEvt = e; render(); });
window.addEventListener('appinstalled', () => { S.installEvt = null; render(); });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

// ---------- Compartir desde otras apps (Instagram, TikTok, YouTube, Facebook) ----------
(() => {
  const ps = new URLSearchParams(location.search);
  if (!['url', 'text', 'title'].some(k => ps.get(k))) return;
  const todo = [ps.get('url'), ps.get('text'), ps.get('title')].filter(Boolean).join(' ');
  const video = primerUrl(ps.get('url')) || primerUrl(todo);
  const titulo = String(ps.get('title') || '').trim();
  let texto = String(ps.get('text') || '').replace(video, '').trim();
  if (!texto && titulo && !/^https:/.test(titulo)) texto = titulo;
  S.compartido = { video, texto: texto.slice(0, 500) };
  history.replaceState({ v: 'muro' }, '', location.pathname);
})();
function abrirCompartido() {
  if (!S.compartido || !S.me) return;
  const pre = S.compartido; S.compartido = null; formPost(pre);
}

// ---------- Arranque ----------
const cfg = window.BO_CONFIG || {};
if (!window.supabase || !cfg.SUPABASE_URL || /TU-PROYECTO/.test(cfg.SUPABASE_URL)) {
  $('#main').innerHTML = '';
  msg(window.supabase ? 'Falta conectar la base de datos: completá <b>config.js</b> con los datos de Supabase.' : 'No pudimos cargar la app. Revisá tu conexión a internet.');
  return;
}
S.sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
let canal = null;
async function conSesion(session) {
  const nuevo = session ? session.user.id : null;
  if (nuevo === S.me && (nuevo === null || S.posts.length)) { render(); return; }
  S.me = nuevo;
  if (canal) { S.sb.removeChannel(canal); canal = null; }
  if (!S.me) { Object.assign(S, { posts: [], coms: [], ceb: [], pas: [], seg: [], reps: [], recl: [], perf: {}, shops: [], admin: false, view: S.view === 'idea' ? 'idea' : 'muro' }); render(); return; }
  if (S.view !== 'idea') S.view = 'muro';
  render(); await cargar();
  abrirCompartido();
  canal = S.sb.channel('barrio').on('postgres_changes', { event: '*', schema: 'public' }, recargar).subscribe();
}
S.sb.auth.onAuthStateChange((ev, session) => {
  if (ev === 'PASSWORD_RECOVERY') { S.recovery = true; S.me = null; render(); return; }
  if (S.recovery) return;
  setTimeout(() => conSesion(session), 0);
});
S.sb.auth.getSession().then(r => conSesion(r.data.session));
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.me) recargar(); });
})();
