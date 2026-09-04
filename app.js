import { seed, toRecord } from '/data/catalog.js';

const initial = seed.map(toRecord);

const STORAGE='carlos-vinyl-inventory-v1';
let rows = load();
let filter='all';
let query='';
let active=null;
const app=document.querySelector('#app');
const THEME_KEY='carlos-vinyl-theme';
let theme=loadTheme();
let showTotals=false;
const PRICE_DISCOUNT=0.20;  // Price sits 20% below the Discogs high
let adding=false;
let view='catalog';  // 'catalog' | 'db'
const MAX_BULK=20;
let syncing=false;
let cancelSync=false;

function loadTheme(){try{const t=localStorage.getItem(THEME_KEY);if(t==='dark'||t==='light')return t}catch{}
  return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
function applyTheme(){document.documentElement.dataset.theme=theme;const m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',theme==='dark'?'#0a1120':'#0d1b2a')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';try{localStorage.setItem(THEME_KEY,theme)}catch{}applyTheme();render()}

function load(){try{const x=JSON.parse(localStorage.getItem(STORAGE));if(Array.isArray(x)&&x.length)return x.map(migrate)}catch{}return structuredClone(initial)}
// Older saves carried askingPrice; it is now just `price`.
function migrate(r){if(r.price===undefined)r.price=r.askingPrice??'';if(r.photo===undefined)r.photo='';delete r.askingPrice;return r}
function save(){localStorage.setItem(STORAGE,JSON.stringify(rows));render();}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function money(r){const v=num(r.price);return v===null?'':`${r.currency||'$'} ${v.toFixed(2)}`}
function counts(){return{total:rows.length,resolved:rows.filter(r=>!r.unresolved).length,unresolved:rows.filter(r=>r.unresolved).length,priced:rows.filter(r=>num(r.price)!==null).length}}
function filtered(){return rows.filter(r=>{const f=filter==='all'||(filter==='unresolved'&&r.unresolved)||(filter==='priced'&&num(r.price)!==null)||(filter==='linked'&&r.discogsId);const hay=[r.number,r.artist,r.release,r.label,r.catno,r.country,r.year].join(' ').toLowerCase();return f&&hay.includes(query.toLowerCase())})}

function render(){if(view==='db')return renderDb();if(view==='report')return renderReport();const c=counts();app.innerHTML=`<div class="shell"><header class="topbar"><div class="brand"><div><div class="eyebrow">Personal Vinyl Inventory</div><div class="title">Carlos Vinyl Catalog</div><div class="subtitle">Discogs-assisted research, grading, pricing and export</div></div><div class="status-wrap"><div class="status"><span id="tokenDot" class="dot"></span><span id="tokenText">Checking Discogs connection…</span></div><button class="theme-btn" id="themeBtn" type="button" aria-pressed="${theme==='dark'}">${theme==='dark'?'☀️ Light mode':'🌙 Dark mode'}</button></div></div><div class="metrics"><div class="metric"><b>${c.total}</b><span>Total records</span></div><div class="metric"><b>${c.resolved}</b><span>Resolved</span></div><div class="metric"><b>${c.unresolved}</b><span>Needs verification</span></div><div class="metric"><b>${c.priced}</b><span>Marketplace priced</span></div></div></header>
<div class="toolbar"><div class="seg"><button class="seg-btn on" id="vCatalog">Catalog</button><button class="seg-btn" id="vDb">Database</button><button class="seg-btn" id="vReport">Report</button></div>
<input id="q" placeholder="Search artist, release, label, catalog number…" value="${esc(query)}"><select id="filter"><option value="all">All records</option><option value="unresolved">Needs verification</option><option value="linked">Discogs linked</option><option value="priced">Priced</option></select>
<details class="menu"><summary class="btn primary">Add</summary><div class="menu-pop"><button data-act="addRec">Single record…</button><button data-act="bulkAdd">Many at once (up to ${MAX_BULK})…</button></div></details>
<details class="menu"><summary class="btn">Discogs</summary><div class="menu-pop"><button data-act="rebuild">Rebuild everything from Discogs</button><button data-act="syncAll">Refresh the records I have</button><button data-act="calcAll">Calculate all fields</button></div></details>
<details class="menu"><summary class="btn">Export</summary><div class="menu-pop"><button data-act="report">Collection report (PDF)…</button><button data-act="forSale">For-sale list…</button><button data-act="xls">Excel spreadsheet</button><button data-act="json">Backup JSON</button><label class="menu-file">Restore from backup…<input type="file" accept="application/json,.json" id="importJson" hidden></label><button data-act="reset" class="danger-item">Reset catalog…</button></div></details></div>
<div class="sync-bar${syncing?' on':''}" id="syncBar"><div class="sync-text" id="syncText">Preparing…</div><div class="sync-track"><div class="sync-fill" id="syncFill"></div></div><button class="btn" id="syncCancel" type="button">Stop</button><div class="sync-sub" id="syncSub"></div></div>
<main class="content">${totalsHtml()}<div class="mobile-list">${filtered().map(cardHtml).join('')}${filtered().length?'':'<div class="empty">No records match this filter.</div>'}</div><div class="table-card desktop-table"><div class="table-wrap"><table><thead><tr><th>#</th><th>Artist</th><th>Release</th><th>Label</th><th>Cat #</th><th>Country</th><th>Year</th><th>Media</th><th>Sleeve</th><th>Discogs ID</th><th>For Sale</th><th class="price-col">Price</th><th>Status</th><th class="actions">Actions</th></tr></thead><tbody>${filtered().map(rowHtml).join('')}</tbody></table>${filtered().length?'':'<div class="empty">No records match this filter.</div>'}</div></div><div class="footer-note">Marketplace fields are populated only when Discogs returns them. Missing or restricted values stay blank instead of being estimated.</div></main><div id="drawer" class="drawer"><div class="panel" id="panel"></div></div></div>`;
const f=document.querySelector('#filter');f.value=filter;f.onchange=e=>{filter=e.target.value;render()};document.querySelector('#q').oninput=e=>{query=e.target.value;render()};
document.querySelector('#themeBtn').onclick=toggleTheme;
document.querySelector('#vDb').onclick=()=>{view='db';render()};
document.querySelector('#vReport').onclick=()=>{view='report';render()};
document.querySelector('#importJson').onchange=importJson;
document.querySelector('#syncCancel').onclick=()=>{cancelSync=true};
const ACTIONS={addRec:openAddRecord,bulkAdd:openBulkAdd,rebuild:serverRebuild,syncAll:syncAll,calcAll:calculateAll,
  report:()=>{view='report';render()},forSale:openForSale,xls:exportXls,json:exportJson,
  reset:()=>{if(confirm('Reset all local edits and restore the original 38-record catalog?')){rows=structuredClone(initial);localStorage.removeItem(STORAGE);render()}}};
app.querySelectorAll('.menu-pop [data-act]').forEach(b=>b.onclick=()=>{closeMenus();ACTIONS[b.dataset.act]?.()});
app.querySelectorAll('.menu-pop .menu-file').forEach(l=>l.onclick=e=>e.stopPropagation());
app.querySelectorAll('details.menu').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)document.querySelectorAll('details.menu[open]').forEach(o=>{if(o!==d)o.open=false})}));
document.addEventListener('click',menuOutside);
document.querySelectorAll('[data-edit]').forEach(el=>el.onchange=e=>edit(Number(el.dataset.n),el.dataset.edit,e.target.value));document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openDrawer(Number(b.dataset.open)));document.querySelectorAll('[data-market]').forEach(b=>b.onclick=()=>refreshMarket(Number(b.dataset.market),b));checkStatus();}

function cardHtml(r){const status=r.unresolved?'<span class="tag warn">VERIFY</span>':r.discogsId?'<span class="tag ok">LINKED</span>':'<span class="tag muted">KNOWN</span>';return `<article class="record-card ${r.unresolved?'unresolved':''}"><div class="record-card-head"><div class="record-headline">${r.photo?`<img class="record-photo" src="${esc(r.photo)}" alt="">`:''}<div><div class="record-number">#${r.number}</div><div class="record-title">${esc(r.artist||'Unknown')}</div><div class="record-release">${esc(r.release||'Untitled')}</div></div></div>${status}</div><div class="record-meta"><span>${esc(r.label||'Label unknown')}</span><span>${esc(r.catno||'Cat # unknown')}</span><span>${esc([r.country,r.year].filter(Boolean).join(' · ')||'Year unknown')}</span></div><div class="record-grid"><label>Media<select class="cell-select" data-edit="media" data-n="${r.number}">${['M','NM','VG+','VG','G+','G','F','P'].map(o=>`<option ${r.media===o?'selected':''}>${o}</option>`).join('')}</select></label><label>Sleeve<select class="cell-select" data-edit="sleeve" data-n="${r.number}">${['M','NM','VG+','VG','G+','G','F','P'].map(o=>`<option ${r.sleeve===o?'selected':''}>${o}</option>`).join('')}</select></label><label>For sale<div class="mobile-value">${esc(r.numForSale||'—')}</div></label><label class="price-field${num(r.price)===null?'':' filled'}">Price<input class="cell-input money price-input" data-edit="price" data-n="${r.number}" value="${esc(r.price)}" placeholder="$"></label><label>Discogs ID<input class="cell-input" data-edit="discogsId" data-n="${r.number}" value="${esc(r.discogsId)}" inputmode="numeric"></label></div><div class="record-actions"><button class="btn primary" data-open="${r.number}">Research</button><button class="btn" data-market="${r.number}" ${r.discogsId?'':'disabled'}>Refresh price</button></div></article>`}

function rowHtml(r){const status=r.unresolved?'<span class="tag warn">VERIFY</span>':r.discogsId?'<span class="tag ok">LINKED</span>':'<span class="tag muted">KNOWN</span>';return `<tr class="${r.unresolved?'unresolved':''}"><td class="num">${r.number}</td>${inputTd(r,'artist',150)}${inputTd(r,'release',170)}${inputTd(r,'label',120)}${inputTd(r,'catno',105)}${inputTd(r,'country',80)}${inputTd(r,'year',58)}${selectTd(r,'media')}${selectTd(r,'sleeve')}<td><input class="cell-input" data-edit="discogsId" data-n="${r.number}" value="${esc(r.discogsId)}" style="width:74px"></td><td class="money">${esc(r.numForSale)}</td><td class="price-cell${num(r.price)===null?'':' filled'}"><input class="cell-input money price-input" data-edit="price" data-n="${r.number}" value="${esc(r.price)}" placeholder="$"></td><td>${status}</td><td class="actions"><button class="mini blue" data-open="${r.number}">Research</button> <button class="mini" data-market="${r.number}" ${r.discogsId?'':'disabled'}>Price</button></td></tr>`}
function inputTd(r,k,w){return `<td><input class="cell-input" style="min-width:${w}px" data-edit="${k}" data-n="${r.number}" value="${esc(r[k])}"></td>`}
function selectTd(r,k){const opts=['M','NM','VG+','VG','G+','G','F','P'];return `<td><select class="cell-select" data-edit="${k}" data-n="${r.number}">${opts.map(o=>`<option ${r[k]===o?'selected':''}>${o}</option>`).join('')}</select></td>`}
function edit(n,k,v){const r=rows.find(x=>x.number===n);if(!r)return;r[k]=v;if(['artist','release','label','catno','country','year'].includes(k)&&v.trim()) r.unresolved = !r.artist || !r.release || !r.label || !r.catno || !r.year;save()}

async function checkStatus(){try{const r=await fetch('/api/status');const j=await r.json();const dot=document.querySelector('#tokenDot');const text=document.querySelector('#tokenText');if(!dot)return;dot.className='dot '+(j.tokenConfigured?'ok':'');text.textContent=j.tokenConfigured?'Discogs token connected':'Discogs token not configured'}catch{}}
function openDrawer(n){active=rows.find(r=>r.number===n);const d=document.querySelector('#drawer'),p=document.querySelector('#panel');d.classList.add('open');const search=[active.artist,active.release,active.catno].filter(Boolean).join(' ');p.innerHTML=`<div class="panel-head"><div><div class="eyebrow" style="color:#667085">Record ${active.number}</div><h2>${esc(active.artist||'Unknown')} · ${esc(active.release||'Untitled')}</h2></div><button class="close" id="close">×</button></div><div class="section"><h3>Discogs Search</h3><div class="search-row"><input id="dsq" value="${esc(search)}"><button class="btn primary" id="dsgo">Search</button></div><div id="searchMsg" class="note" style="margin-top:8px">Search by artist, release title or catalog number, then select the exact pressing.</div><div id="results" class="results"></div></div><div class="section"><h3>Current record</h3><div class="note">Discogs ID: <b>${esc(active.discogsId||'Not linked')}</b><br>Tracks/notes: ${esc(active.tracks||'None entered')}<br>Media: ${esc(active.media)} · Sleeve: ${esc(active.sleeve)}</div></div><div id="detail"></div>`;document.querySelector('#close').onclick=closeDrawer;d.onclick=e=>{if(e.target===d)closeDrawer()};document.querySelector('#dsgo').onclick=searchDiscogs;if(active.discogsId)loadDetail(active.discogsId)}
function closeDrawer(){document.querySelector('#drawer')?.classList.remove('open');active=null}
async function searchDiscogs(){const q=document.querySelector('#dsq').value.trim(),msg=document.querySelector('#searchMsg'),out=document.querySelector('#results');if(!q)return;msg.textContent='Searching Discogs…';out.innerHTML='';try{const r=await fetch('/api/search?q='+encodeURIComponent(q));const j=await r.json();if(!r.ok)throw new Error(j.error||'Search failed');msg.textContent=`${j.results.length} results`;out.innerHTML=j.results.map(x=>`<div class="result">${x.thumb?`<img class="thumb" src="${esc(x.thumb)}">`:'<div class="thumb"></div>'}<div><div class="result-title">${esc(x.title)}</div><div class="result-meta">${esc([x.label,x.catno,x.country,x.year,x.format].filter(Boolean).join(' · '))}</div></div><button class="mini blue" data-pick="${x.id}">Use</button></div>`).join('');out.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>pickRelease(Number(b.dataset.pick)))}catch(e){msg.innerHTML=`<span class="error">${esc(e.message)}</span>`}}
async function pickRelease(id){if(!active)return;active.discogsId=String(id);await loadDetail(id,true);save();openDrawer(active.number)}
async function loadDetail(id,apply=false){const box=document.querySelector('#detail');if(!box)return;box.innerHTML='<div class="section"><div class="note">Loading release details…</div></div>';try{const r=await fetch('/api/release/'+id),j=await r.json();if(!r.ok)throw new Error(j.error||'Release lookup failed');if(apply&&active){active.artist=j.artists||active.artist;active.release=j.title||active.release;active.year=String(j.year||active.year);active.country=j.country||active.country;if(j.labels?.[0]){active.label=j.labels[0].name||active.label;active.catno=j.labels[0].catno||active.catno}active.discogsUrl=j.uri?`https://www.discogs.com${j.uri}`:'';active.tracks=(j.tracklist||[]).map(t=>`${t.position} ${t.title}${t.duration?' '+t.duration:''}`.trim()).join('; ');active.unresolved=false}
box.innerHTML=`<div class="section"><h3>Discogs release</h3><div class="note"><b>${esc(j.artists)}</b> · ${esc(j.title)}<br>${esc([j.labels?.[0]?.name,j.labels?.[0]?.catno,j.country,j.year].filter(Boolean).join(' · '))}${active?.discogsUrl?`<br><a class="discogs-link" target="_blank" href="${esc(active.discogsUrl)}">Open on Discogs</a>`:''}</div></div><div class="section"><h3>Track list</h3><table class="tracks"><tbody>${(j.tracklist||[]).map(t=>`<tr><td style="width:55px">${esc(t.position)}</td><td>${esc(t.title)}</td><td style="width:70px">${esc(t.duration)}</td></tr>`).join('')||'<tr><td>No track list returned.</td></tr>'}</tbody></table></div><div class="section"><h3>Marketplace</h3><button class="btn primary" id="detailPrice">Refresh marketplace stats</button><div id="marketMsg" class="note" style="margin-top:8px"></div></div>`;document.querySelector('#detailPrice').onclick=()=>refreshMarket(active.number,null,true)}catch(e){box.innerHTML=`<div class="section error">${esc(e.message)}</div>`}}
async function refreshMarket(n,btn,inside=false){const r=rows.find(x=>x.number===n);if(!r?.discogsId)return;if(btn)btn.disabled=true;const msg=inside?document.querySelector('#marketMsg'):null;if(msg)msg.textContent='Checking Discogs marketplace…';try{const res=await fetch('/api/marketplace/'+r.discogsId),j=await res.json();if(!res.ok)throw new Error(j.error||'Marketplace lookup failed');if(j.available){r.numForSale=j.numForSale??'';r.lowestPrice=j.lowestPrice?.value??'';r.currency=j.lowestPrice?.currency??'';r.marketplaceStatus='Available';}
      applyHigh(r,j);if(j.available){if(msg)msg.innerHTML=`<span class="success">${esc(String(r.numForSale||0))} for sale · lowest ${esc(money(r)||'not returned')}</span>`}else{r.marketplaceStatus='Unavailable';if(msg)msg.innerHTML=`<span class="error">Marketplace stats unavailable: ${esc(j.reason||'restricted')}</span>`}localStorage.setItem(STORAGE,JSON.stringify(rows));if(!inside)render()}catch(e){r.marketplaceStatus='Error';if(msg)msg.innerHTML=`<span class="error">${esc(e.message)}</span>`;if(!inside)render()}finally{if(btn)btn.disabled=false}}

// ---------- Report view (annual-report style) ----------
function reportDate(){return new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}
function reportStats(){const t=totals();
  const linkedPct=rows.length?Math.round(t.linked/rows.length*100):0;
  const verified=rows.filter(r=>!r.unresolved).length;
  const forSale=rows.filter(r=>num(r.price)!==null).length;
  const cur=t.currencies.size===1?[...t.currencies][0]:'';
  return {...t,linkedPct,verified,forSale,cur}}
function money0(v,cur){return v===null||v===undefined||v===''?'—':`${cur||''}${cur?' ':''}${Number(v).toFixed(2)}`}
function renderReport(){const st=reportStats();const cur=st.cur;
  const held=rows.slice().sort((a,b)=>Number(a.number)-Number(b.number));
  const unresolved=held.filter(r=>r.unresolved);
  const priced=held.filter(r=>num(r.price)!==null);
  const byLabel={};for(const r of held){const k=r.label||'Unattributed';(byLabel[k] ||= []).push(r)}
  const labelRows=Object.entries(byLabel).sort((a,b)=>b[1].length-a[1].length).slice(0,10);
  app.innerHTML=`<div class="report-shell">
  <div class="report-bar no-print"><div class="report-bar-inner"><span class="report-bar-title">Collection Report</span>
    <div class="report-bar-actions"><button class="btn" id="repBack">← Back</button><button class="btn primary" id="repPrint">Print / Save as PDF</button></div></div></div>
  <article class="report" id="report">

    <section class="rp-cover">
      <div class="rp-rule-top"></div>
      <div class="rp-cover-body">
        <p class="rp-eyebrow">Personal Vinyl Inventory</p>
        <h1 class="rp-title">Carlos Vinyl<br>Catalog</h1>
        <p class="rp-standfirst">Collection Report &amp; Schedule of Holdings</p>
        <p class="rp-date">As at ${esc(reportDate())}</p>
      </div>
      <table class="rp-cover-figures"><tbody>
        <tr><td>Records held</td><td class="rp-fig">${st.total}</td></tr>
        <tr><td>Identified on Discogs</td><td class="rp-fig">${st.linked}</td></tr>
        <tr><td>Verified pressings</td><td class="rp-fig">${st.verified}</td></tr>
        <tr><td>Carrying a price</td><td class="rp-fig">${st.priced}</td></tr>
        <tr class="rp-total"><td>Total collection price</td><td class="rp-fig">${money0(st.estSum,cur)}</td></tr>
      </tbody></table>
      <div class="rp-rule-bottom"></div>
    </section>

    <section class="rp-section rp-break">
      <p class="rp-sec-no">Section 01</p>
      <h2 class="rp-h2">Summary of the collection</h2>
      <p class="rp-lede">The catalogue comprises ${st.total} records. ${st.linked} of these (${st.linkedPct}%) are matched to an exact Discogs pressing; the remainder are held pending identification and are listed in Section 03.</p>
      <table class="rp-table rp-kpi"><thead><tr><th>Measure</th><th class="rp-num">Value</th><th>Basis</th></tr></thead><tbody>
        <tr><td>Records held</td><td class="rp-num">${st.total}</td><td>Physical count</td></tr>
        <tr><td>Identified on Discogs</td><td class="rp-num">${st.linked}</td><td>Exact pressing matched</td></tr>
        <tr><td>Awaiting verification</td><td class="rp-num">${st.unresolved}</td><td>Incomplete pressing detail</td></tr>
        <tr><td>Carrying a price</td><td class="rp-num">${st.priced}</td><td>Discogs high less 20%</td></tr>
        <tr><td>Sum of Discogs highs</td><td class="rp-num">${money0(st.highSum,cur)}</td><td>Condition-based suggestions</td></tr>
        <tr><td>Average price per record</td><td class="rp-num">${st.estCount?money0(st.estSum/st.estCount,cur):'—'}</td><td>Priced records only</td></tr>
        <tr class="rp-total"><td>Total collection price</td><td class="rp-num">${money0(st.estSum,cur)}</td><td>Sum of priced records</td></tr>
      </tbody></table>
      ${st.noPrice?`<p class="rp-note"><span class="rp-note-label">Note</span> ${st.noPrice} of ${st.total} records carry no price and are included at nil. The total above is therefore understated and is not a valuation.</p>`:''}
      ${labelRows.length?`<h3 class="rp-h3">Concentration by label</h3>
      <table class="rp-table"><thead><tr><th>Label</th><th class="rp-num">Records</th><th class="rp-num">Share</th></tr></thead><tbody>
      ${labelRows.map(([l,rs])=>`<tr><td>${esc(l)}</td><td class="rp-num">${rs.length}</td><td class="rp-num">${Math.round(rs.length/st.total*100)}%</td></tr>`).join('')}
      </tbody></table>`:''}
    </section>

    <section class="rp-section rp-break">
      <p class="rp-sec-no">Section 02</p>
      <h2 class="rp-h2">Schedule of holdings</h2>
      <p class="rp-lede">All ${held.length} records, in catalogue order.</p>
      <table class="rp-table rp-schedule"><thead><tr>
        <th class="rp-num">#</th><th>Artist</th><th>Release</th><th>Label</th><th>Cat.&nbsp;no.</th>
        <th>Country</th><th class="rp-num">Year</th><th>Media</th><th>Sleeve</th><th class="rp-num">Price</th>
      </tr></thead><tbody>
      ${held.map(r=>`<tr${r.unresolved?' class="rp-pending"':''}>
        <td class="rp-num">${esc(r.number)}</td><td>${esc(r.artist||'—')}</td><td>${esc(r.release||'—')}</td>
        <td>${esc(r.label||'—')}</td><td>${esc(r.catno||'—')}</td><td>${esc(r.country||'—')}</td>
        <td class="rp-num">${esc(r.year||'—')}</td><td>${esc(r.media||'—')}</td><td>${esc(r.sleeve||'—')}</td>
        <td class="rp-num">${num(r.price)===null?'—':money0(r.price,r.currency)}</td></tr>`).join('')}
      </tbody>
      <tfoot><tr class="rp-total"><td colspan="9">Total — ${priced.length} record${priced.length===1?'':'s'} priced</td><td class="rp-num">${money0(st.estSum,cur)}</td></tr></tfoot>
      </table>
    </section>

    ${unresolved.length?`<section class="rp-section rp-break">
      <p class="rp-sec-no">Section 03</p>
      <h2 class="rp-h2">Holdings awaiting verification</h2>
      <p class="rp-lede">${unresolved.length} record${unresolved.length===1?'':'s'} could not be matched to an exact pressing with confidence. They are held at nil and carry only the detail below.</p>
      <table class="rp-table"><thead><tr><th class="rp-num">#</th><th>Artist</th><th>Release</th><th>Identifying detail</th></tr></thead><tbody>
      ${unresolved.map(r=>`<tr><td class="rp-num">${esc(r.number)}</td><td>${esc(r.artist||'—')}</td><td>${esc(r.release||'—')}</td><td>${esc(r.tracks||r.label||'No detail recorded')}</td></tr>`).join('')}
      </tbody></table>
    </section>`:''}

    <section class="rp-section rp-break">
      <p class="rp-sec-no">Section ${unresolved.length?'04':'03'}</p>
      <h2 class="rp-h2">Basis of preparation</h2>
      <div class="rp-basis">
        <div><h3 class="rp-h3">Source of data</h3><p>Pressing detail, track listings and marketplace figures are retrieved from the Discogs API against the release identified for each record. Records are matched on an exact catalogue number, or on artist and title appearing together in the release title; anything less certain is left unmatched rather than assumed.</p></div>
        <div><h3 class="rp-h3">Pricing</h3><p>Price is the Discogs condition-based high-end suggestion less 20%, or a figure entered by hand where one has been supplied. Where Discogs returns no suggestion the record is carried at nil.</p></div>
        <div><h3 class="rp-h3">Condition</h3><p>Media and sleeve are graded on the Goldmine scale (M, NM, VG+, VG, G+, G, F, P). Grades are the holder's own assessment and are not independently verified.</p></div>
        <div><h3 class="rp-h3">Limitations</h3><p>This document is a personal inventory record. It is not an appraisal, a valuation, or an offer to sell, and the figures should not be relied upon as any of those. Marketplace figures move continually and are accurate only as at the date shown.</p></div>
      </div>
    </section>
  </article></div>`;
  document.querySelector('#repBack').onclick=()=>{view='catalog';render()};
  document.querySelector('#repPrint').onclick=()=>window.print();
}

// ---------- Database screen (spreadsheet-style) ----------
const DB_COLS=[
  {k:'number',label:'#',w:52,type:'num',ro:true},
  {k:'artist',label:'Artist',w:170},
  {k:'release',label:'Release',w:190},
  {k:'label',label:'Label',w:150},
  {k:'catno',label:'Cat #',w:120},
  {k:'country',label:'Country',w:96},
  {k:'year',label:'Year',w:66},
  {k:'media',label:'Media',w:76,type:'grade'},
  {k:'sleeve',label:'Sleeve',w:76,type:'grade'},
  {k:'discogsId',label:'Discogs ID',w:100},
  {k:'numForSale',label:'For sale',w:76},
  {k:'highestPrice',label:'Discogs high',w:104},
  {k:'price',label:'Price',w:96,cls:'price-cell'},
  {k:'currency',label:'Currency',w:82},
  {k:'marketplaceStatus',label:'Status',w:120},
  {k:'tracks',label:'Tracks / notes',w:280}
];
let dbSel=new Set();
function dbRows(){const q=query.toLowerCase();
  return rows.filter(r=>!q||DB_COLS.some(c=>String(r[c.k]??'').toLowerCase().includes(q)))}
function renderDb(){const list=dbRows();
  app.innerHTML=`<div class="shell db-shell"><header class="topbar db-topbar"><div class="brand"><div><div class="eyebrow">Database editor</div><div class="title">Edit all ${rows.length} records</div><div class="subtitle">Every field is editable. Changes save to this device as you type.</div></div><div class="status-wrap"><button class="theme-btn" id="themeBtn" type="button">${theme==='dark'?'☀️ Light mode':'🌙 Dark mode'}</button><button class="theme-btn" id="backBtn" type="button">← Back to catalog</button></div></div></header>
  <div class="toolbar"><div class="seg"><button class="seg-btn" id="vCatalog2">Catalog</button><button class="seg-btn on" id="vDb2">Database</button><button class="seg-btn" id="vReport2">Report</button></div><input id="q" placeholder="Filter any column…" value="${esc(query)}">
  <button class="btn primary" id="dbAdd">+ Blank row</button>
  <button class="btn" id="dbDup" ${dbSel.size?'':'disabled'}>Duplicate (${dbSel.size})</button>
  <button class="btn danger" id="dbDel" ${dbSel.size?'':'disabled'}>Delete (${dbSel.size})</button>
  <button class="btn" id="dbGrade" ${dbSel.size?'':'disabled'}>Set grade…</button>
  <button class="btn" id="dbRenum">Renumber</button>
  <button class="btn" id="dbXls">Export Excel</button>
  <button class="btn" id="dbJson">Backup JSON</button></div>
  <main class="content db-content"><div class="table-card"><div class="table-wrap db-wrap"><table class="db-table"><thead><tr><th class="db-check"><input type="checkbox" id="dbAll" ${list.length&&list.every(r=>dbSel.has(r.number))?'checked':''}></th>${DB_COLS.map(c=>`<th style="min-width:${c.w}px">${esc(c.label)}</th>`).join('')}</tr></thead>
  <tbody>${list.map(dbRowHtml).join('')}</tbody></table>${list.length?'':'<div class="empty">No rows match this filter.</div>'}</div></div>
  <div class="footer-note">${list.length} of ${rows.length} rows shown. Editing here changes the same catalog the main screen uses.</div></main></div>`;
  document.querySelector('#themeBtn').onclick=toggleTheme;
  document.querySelector('#backBtn').onclick=()=>{view='catalog';render()};
  document.querySelector('#vCatalog2').onclick=()=>{view='catalog';render()};
  document.querySelector('#vReport2').onclick=()=>{view='report';render()};
  document.querySelector('#q').oninput=e=>{query=e.target.value;renderDb()};
  document.querySelector('#dbAdd').onclick=dbAddBlank;
  document.querySelector('#dbDup').onclick=dbDuplicate;
  document.querySelector('#dbDel').onclick=dbDelete;
  document.querySelector('#dbGrade').onclick=dbSetGrade;
  document.querySelector('#dbRenum').onclick=dbRenumber;
  document.querySelector('#dbXls').onclick=exportXls;
  document.querySelector('#dbJson').onclick=exportJson;
  document.querySelector('#dbAll').onchange=e=>{if(e.target.checked)list.forEach(r=>dbSel.add(r.number));else list.forEach(r=>dbSel.delete(r.number));renderDb()};
  app.querySelectorAll('[data-dbsel]').forEach(cb=>cb.onchange=()=>{const n=Number(cb.dataset.dbsel);cb.checked?dbSel.add(n):dbSel.delete(n);renderDb()});
  app.querySelectorAll('[data-dbedit]').forEach(el=>{el.onchange=e=>dbEdit(Number(el.dataset.n),el.dataset.dbedit,e.target.value)});
}
function dbRowHtml(r){return `<tr class="${r.unresolved?'unresolved':''}${dbSel.has(r.number)?' picked':''}"><td class="db-check"><input type="checkbox" data-dbsel="${r.number}" ${dbSel.has(r.number)?'checked':''}></td>${DB_COLS.map(c=>{
  if(c.ro)return `<td class="num">${esc(r[c.k]??'')}</td>`;
  if(c.type==='grade')return `<td><select class="cell-select" data-dbedit="${c.k}" data-n="${r.number}">${['M','NM','VG+','VG','G+','G','F','P'].map(o=>`<option ${r[c.k]===o?'selected':''}>${o}</option>`).join('')}</select></td>`;
  return `<td class="${c.cls||''}"><input class="cell-input${c.cls?' price-input money':''}" data-dbedit="${c.k}" data-n="${r.number}" value="${esc(r[c.k]??'')}"></td>`}).join('')}</tr>`}
function dbEdit(n,k,v){const r=rows.find(x=>x.number===n);if(!r)return;r[k]=v;
  r.unresolved=!(r.artist&&r.release&&r.label&&r.catno&&r.year);
  try{localStorage.setItem(STORAGE,JSON.stringify(rows))}catch{}}
function dbAddBlank(){rows.push({number:nextNumber(),artist:'',release:'',label:'',catno:'',country:'',year:'',tracks:'',unresolved:true,
  discogsId:'',media:'VG+',sleeve:'VG+',numForSale:'',lowestPrice:'',highestPrice:'',highestCondition:'',currency:'',price:'',photo:'',discogsUrl:'',marketplaceStatus:'Pending'});
  save();renderDb()}
function dbDuplicate(){const picked=rows.filter(r=>dbSel.has(r.number));let n=nextNumber();
  for(const r of picked)rows.push({...r,number:n++,photo:''});
  dbSel.clear();save();renderDb()}
function dbDelete(){const picked=rows.filter(r=>dbSel.has(r.number));
  if(!confirm(`Delete ${picked.length} record${picked.length===1?'':'s'}? This cannot be undone — export a backup first if you are unsure.`))return;
  rows=rows.filter(r=>!dbSel.has(r.number));dbSel.clear();save();renderDb()}
function dbSetGrade(){const g=prompt('Set media and sleeve grade for the selected rows (M, NM, VG+, VG, G+, G, F, P):','VG+');
  if(!g)return;const up=g.trim().toUpperCase();
  if(!['M','NM','VG+','VG','G+','G','F','P'].includes(up)){alert('Not a Goldmine grade: '+g);return}
  for(const r of rows)if(dbSel.has(r.number)){r.media=up;r.sleeve=up}
  save();renderDb()}
function dbRenumber(){if(!confirm('Renumber every record 1..'+rows.length+' in the current order?'))return;
  rows.forEach((r,i)=>{r.number=i+1});dbSel.clear();save();renderDb()}

// ---------- Import a catalogue ----------
async function importJson(e){const file=e.target.files?.[0];if(!file)return;e.target.value='';
  try{const text=await file.text();const parsed=JSON.parse(text);
    const incoming=Array.isArray(parsed)?parsed:parsed.records;
    if(!Array.isArray(incoming)||!incoming.length)throw new Error('That file has no record array in it.');
    const bad=incoming.find(r=>typeof r!=='object'||r===null);
    if(bad)throw new Error('That file contains something that is not a record.');
    if(!confirm(`Replace the current ${rows.length} records with ${incoming.length} from this file?\n\nExport a backup first if you have edits you want to keep.`))return;
    rows=incoming.map((r,i)=>migrate({number:r.number??i+1,artist:'',release:'',label:'',catno:'',country:'',year:'',tracks:'',unresolved:false,
      discogsId:'',media:'VG+',sleeve:'VG+',numForSale:'',lowestPrice:'',highestPrice:'',highestCondition:'',currency:'',price:'',photo:'',discogsUrl:'',marketplaceStatus:'Pending',...r}));
    save();view='catalog';render();
    alert(`Imported ${rows.length} records.`)}
  catch(err){alert('Import failed: '+err.message)}}

// ---------- Bulk add (up to MAX_BULK at once) ----------
let bulk=[];
function openBulkAdd(){bulk=[];renderBulk()}
function renderBulk(){const d=document.querySelector('#drawer'),p=document.querySelector('#panel');
  active=null;d.classList.add('open');
  p.innerHTML=`<div class="panel-head"><div><div class="eyebrow" style="color:#667085">Bulk add</div><h2>Add up to ${MAX_BULK} records</h2></div><button class="close" id="close">×</button></div>
  <div class="section"><h3>Photos</h3><div class="add-photo-actions">
    <label class="btn primary photo-btn">Take photos<input type="file" accept="image/*" capture="environment" multiple id="bkCamera" hidden></label>
    <label class="btn photo-btn">Choose images<input type="file" accept="image/*" multiple id="bkFiles" hidden></label></div>
    <div class="note" style="margin-top:8px">One record per photo. Photos are kept on this device for reference — they do not identify the pressing, so add a title below or look each one up after adding.</div></div>
  <div class="section"><h3>Or paste a list</h3><textarea id="bkText" class="bulk-text" rows="6" placeholder="One record per line:&#10;Aphex Twin - Windowlicker&#10;The Advent - Panther EP&#10;Nervous Records NE 20478"></textarea>
    <div class="add-photo-actions" style="margin-top:8px"><button class="btn" id="bkParse">Add lines to list</button>
    <label class="bulk-check"><input type="checkbox" id="bkLookup" checked> Look each one up on Discogs</label></div></div>
  <div class="section"><h3>Queued (${bulk.length} / ${MAX_BULK})</h3><div id="bkList" class="bulk-list">${bulk.length?bulk.map(bulkItemHtml).join(''):'<div class="note">Nothing queued yet.</div>'}</div></div>
  <div class="section"><div class="sale-actions"><button class="btn primary" id="bkSave" ${bulk.length?'':'disabled'}>Add ${bulk.length} record${bulk.length===1?'':'s'}</button><button class="btn" id="bkClear" ${bulk.length?'':'disabled'}>Clear</button><button class="btn" id="bkCancel">Close</button></div><div id="bkMsg" class="note" style="margin-top:8px"></div></div>`;
  document.querySelector('#close').onclick=closeBulk;document.querySelector('#bkCancel').onclick=closeBulk;
  d.onclick=e=>{if(e.target===d)closeBulk()};
  const addPhotos=async e=>{const files=[...(e.target.files||[])];if(!files.length)return;
    const msg=document.querySelector('#bkMsg');const room=MAX_BULK-bulk.length;
    if(room<=0){msg.innerHTML=`<span class="error">The queue already holds ${MAX_BULK}.</span>`;return}
    const take=files.slice(0,room);
    msg.textContent=`Processing ${take.length} photo${take.length===1?'':'s'}…`;
    for(const f of take){try{bulk.push({title:'',photo:await shrinkImage(f),from:'photo'})}catch{}}
    renderBulk();
    document.querySelector('#bkMsg').textContent=files.length>room?`Added ${take.length}. ${files.length-room} skipped — the limit is ${MAX_BULK} at a time.`:`Added ${take.length}.`};
  document.querySelector('#bkCamera').onchange=addPhotos;document.querySelector('#bkFiles').onchange=addPhotos;
  document.querySelector('#bkParse').onclick=()=>{const raw=document.querySelector('#bkText').value.split('\n').map(x=>x.trim()).filter(Boolean);
    const msg=document.querySelector('#bkMsg');const room=MAX_BULK-bulk.length;
    if(room<=0){msg.innerHTML=`<span class="error">The queue already holds ${MAX_BULK}.</span>`;return}
    const take=raw.slice(0,room);take.forEach(t=>bulk.push({title:t,photo:'',from:'text'}));
    renderBulk();document.querySelector('#bkMsg').textContent=raw.length>room?`Added ${take.length} line${take.length===1?'':'s'}. ${raw.length-room} skipped — the limit is ${MAX_BULK}.`:`Added ${take.length} line${take.length===1?'':'s'}.`};
  document.querySelectorAll('[data-bkdel]').forEach(b=>b.onclick=()=>{bulk.splice(Number(b.dataset.bkdel),1);renderBulk()});
  document.querySelectorAll('[data-bktitle]').forEach(i=>i.onchange=e=>{bulk[Number(i.dataset.bktitle)].title=e.target.value});
  document.querySelector('#bkClear').onclick=()=>{bulk=[];renderBulk()};
  document.querySelector('#bkSave').onclick=saveBulk}
function bulkItemHtml(b,i){return `<div class="bulk-item">${b.photo?`<img class="bulk-thumb" src="${b.photo}" alt="">`:'<div class="bulk-thumb"></div>'}<input data-bktitle="${i}" value="${esc(b.title)}" placeholder="Artist - title (optional)"><button class="mini" data-bkdel="${i}">Remove</button></div>`}
function closeBulk(){bulk=[];closeDrawer()}
async function saveBulk(){const msg=document.querySelector('#bkMsg'),btn=document.querySelector('#bkSave');
  const lookup=document.querySelector('#bkLookup').checked;
  btn.disabled=true;let n=nextNumber(),added=0,linked=0,failed=0;
  for(let i=0;i<bulk.length;i++){const b=bulk[i];
    msg.textContent=`Adding ${i+1} of ${bulk.length}…`;
    const rec={number:n++,artist:'',release:'',label:'',catno:'',country:'',year:'',tracks:'',unresolved:true,
      discogsId:'',media:'VG+',sleeve:'VG+',numForSale:'',lowestPrice:'',highestPrice:'',highestCondition:'',currency:'',
      price:'',photo:b.photo||'',discogsUrl:'',marketplaceStatus:'Pending'};
    if(b.title){const parts=b.title.split(/\s+[-–—]\s+/);
      if(parts.length>1){rec.artist=parts[0].trim();rec.release=parts.slice(1).join(' - ').trim()}else rec.release=b.title}
    if(lookup&&b.title){
      try{const sr=await api('/api/search?q='+encodeURIComponent(b.title));await sleep(PACE);
        const hit=(sr.results||[])[0];
        if(hit){const rel=await api('/api/release/'+hit.id);await sleep(PACE);
          rec.discogsId=String(hit.id);applyRelease(rec,rel);linked++}}
      catch{failed++}}
    rows.push(rec);added++}
  try{localStorage.setItem(STORAGE,JSON.stringify(rows))}
  catch{for(const r of rows)if(!r.price&&r.photo&&rows.indexOf(r)>=rows.length-added)r.photo='';
    try{localStorage.setItem(STORAGE,JSON.stringify(rows))}catch{}
    msg.innerHTML='<span class="error">Storage was full, so photos on the new records were dropped. The records were kept.</span>'}
  closeBulk();render();
  alert(`Added ${added} record${added===1?'':'s'}.${linked?`\n${linked} matched on Discogs.`:''}${failed?`\n${failed} lookup${failed===1?'':'s'} failed.`:''}\n\nBulk lookups take the first Discogs result, so check them before selling — open each one with Research to pick an exact pressing.`)}

// ---------- Server-side rebuild ----------
// /api/enrich does the Discogs work on the server in slices, so the phone
// makes ~7 requests instead of ~150. It rebuilds from the seed catalogue,
// so it replaces local edits — hence the warning and the backup prompt.
async function serverRebuild(){
  const st=await api('/api/status').catch(()=>null);
  if(!st?.tokenConfigured){alert('Discogs is not connected, so there is nothing to rebuild from.');return}
  if(!confirm('Rebuild every record from Discogs?\n\nThis replaces the current catalog — including your own edits, prices and photos — with freshly fetched data for the original 38 records.\n\nExport a Backup JSON first if you want to keep what is here.'))return;
  syncing=true;cancelSync=false;render();
  const out=[],notes=[];let start=0,total=38,guard=0;
  try{
    while(guard++<40){
      if(cancelSync)break;
      progress(out.length,total,'Fetching from Discogs on the server…');
      const j=await api(`/api/enrich?start=${start}&count=6`);
      total=j.total||total;
      out.push(...(j.records||[]));notes.push(...(j.notes||[]));
      progress(out.length,total,`${out.length} of ${total} rebuilt`);
      if(j.done)break;
      if(j.rateLimited){progress(out.length,total,'Discogs rate limit — waiting…');await sleep(20000)}
      start=j.next;
    }
  }catch(e){syncing=false;render();alert('Rebuild stopped: '+e.message+'\n\nNothing was changed.');return}
  if(!out.length){syncing=false;render();alert('Nothing came back from the server. Nothing was changed.');return}
  rows=out.map(migrate);syncing=false;showTotals=true;
  try{localStorage.setItem(STORAGE,JSON.stringify(rows))}catch{}
  render();
  const linked=notes.filter(n=>n.linked).length, matched=notes.filter(n=>n.matched).length;
  const noMatch=notes.filter(n=>!n.matched).length;
  const reasons=[...new Set(out.map(r=>r.suggestionsReason).filter(Boolean))];
  alert(`Rebuilt ${out.length} records from Discogs.\n\n${matched} matched to a pressing\n${linked} newly linked\n${noMatch} left unlinked (no confident match)\n\n${reasons.length?'Prices are blank because Discogs said: "'+reasons[0]+'"':'Prices filled where Discogs returned a high-end suggestion.'}${cancelSync?'\n\nStopped early.':''}`)}

// ---------- Add a record ----------
let draft=null;
function blankDraft(){return{artist:'',release:'',label:'',catno:'',country:'',year:'',tracks:'',discogsId:'',discogsUrl:'',media:'VG+',sleeve:'VG+',photo:''}}
function nextNumber(){return rows.reduce((m,r)=>Math.max(m,Number(r.number)||0),0)+1}
// Photos are stored inline in localStorage, so they are downscaled hard before
// being kept. A quota failure drops the photo rather than losing the record.
function shrinkImage(file,max=640,quality=0.65){return new Promise((resolve,reject)=>{
  const img=new Image();const url=URL.createObjectURL(file);
  img.onload=()=>{const scale=Math.min(1,max/Math.max(img.width,img.height));
    const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
    resolve(c.toDataURL('image/jpeg',quality))};
  img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('That file could not be read as an image.'))};
  img.src=url})}
function openAddRecord(){draft=blankDraft();adding=true;renderAdd()}
function renderAdd(){const d=document.querySelector('#drawer'),p=document.querySelector('#panel');
  active=null;d.classList.add('open');
  const f=(k,label,extra='')=>`<label class="add-field"><span>${label}</span><input id="af_${k}" value="${esc(draft[k])}" ${extra}></label>`;
  p.innerHTML=`<div class="panel-head"><div><div class="eyebrow" style="color:#667085">New record</div><h2>Add to the catalog</h2></div><button class="close" id="close">×</button></div>
  <div class="section"><h3>Photo of the sleeve or label</h3>
    <div class="add-photo">${draft.photo?`<img src="${draft.photo}" alt="Record photo">`:'<div class="add-photo-empty">No photo yet</div>'}</div>
    <div class="add-photo-actions"><label class="btn primary photo-btn">Take photo<input type="file" accept="image/*" capture="environment" id="afCamera" hidden></label>
    <label class="btn photo-btn">Choose image<input type="file" accept="image/*" id="afFile" hidden></label>
    ${draft.photo?'<button class="btn" id="afClearPhoto">Remove</button>':''}</div>
    <div class="note" style="margin-top:8px">The photo is stored on this device with the record. It is for your own reference — it is not sent anywhere and it does not identify the pressing on its own, so use the Discogs lookup below to fill in the details.</div>
    <div id="afPhotoMsg" class="note"></div></div>
  <div class="section"><h3>Find it on Discogs</h3><div class="search-row"><input id="afq" placeholder="Artist, title or catalog number" value="${esc([draft.artist,draft.release,draft.catno].filter(Boolean).join(' '))}"><button class="btn primary" id="afGo">Search</button></div>
    <div id="afMsg" class="note" style="margin-top:8px">Search Discogs and pick the exact pressing, or skip this and type the details in by hand.</div><div id="afResults" class="results"></div></div>
  <div class="section"><h3>Details</h3><div class="add-grid">
    ${f('artist','Artist')}${f('release','Release')}${f('label','Label')}${f('catno','Catalog number')}${f('country','Country')}${f('year','Year','inputmode="numeric"')}${f('discogsId','Discogs ID','inputmode="numeric"')}
    <label class="add-field"><span>Media</span><select id="af_media">${['M','NM','VG+','VG','G+','G','F','P'].map(o=>`<option ${draft.media===o?'selected':''}>${o}</option>`).join('')}</select></label>
    <label class="add-field"><span>Sleeve</span><select id="af_sleeve">${['M','NM','VG+','VG','G+','G','F','P'].map(o=>`<option ${draft.sleeve===o?'selected':''}>${o}</option>`).join('')}</select></label>
  </div></div>
  <div class="section"><div class="sale-actions"><button class="btn primary" id="afSave">Add record</button><button class="btn" id="afCancel">Cancel</button></div><div id="afSaveMsg" class="note" style="margin-top:8px"></div></div>`;
  document.querySelector('#close').onclick=closeAdd;document.querySelector('#afCancel').onclick=closeAdd;
  d.onclick=e=>{if(e.target===d)closeAdd()};
  for(const k of ['artist','release','label','catno','country','year','discogsId','media','sleeve'])
    document.querySelector('#af_'+k).onchange=e=>{draft[k]=e.target.value};
  const photo=async(e)=>{const file=e.target.files?.[0];if(!file)return;const msg=document.querySelector('#afPhotoMsg');
    msg.textContent='Processing photo…';
    try{draft.photo=await shrinkImage(file);renderAdd()}catch(err){msg.innerHTML=`<span class="error">${esc(err.message)}</span>`}};
  document.querySelector('#afCamera').onchange=photo;document.querySelector('#afFile').onchange=photo;
  document.querySelector('#afClearPhoto')?.addEventListener('click',()=>{draft.photo='';renderAdd()});
  document.querySelector('#afGo').onclick=addSearch;
  document.querySelector('#afq').onkeydown=e=>{if(e.key==='Enter')addSearch()};
  document.querySelector('#afSave').onclick=saveDraft}
function closeMenus(){document.querySelectorAll('details.menu[open]').forEach(d=>d.open=false)}
function menuOutside(e){if(!e.target.closest('details.menu'))closeMenus()}
function closeAdd(){adding=false;draft=null;closeDrawer()}
async function addSearch(){const q=document.querySelector('#afq').value.trim(),msg=document.querySelector('#afMsg'),out=document.querySelector('#afResults');
  if(!q){msg.textContent='Type something to search for first.';return}
  msg.textContent='Searching Discogs…';out.innerHTML='';
  try{const j=await api('/api/search?q='+encodeURIComponent(q));
    msg.textContent=`${j.results.length} result${j.results.length===1?'':'s'} — pick the exact pressing`;
    out.innerHTML=j.results.map(x=>`<div class="result">${x.thumb?`<img class="thumb" src="${esc(x.thumb)}">`:'<div class="thumb"></div>'}<div><div class="result-title">${esc(x.title)}</div><div class="result-meta">${esc([x.label,x.catno,x.country,x.year,x.format].filter(Boolean).join(' · '))}</div></div><button class="mini blue" data-add="${x.id}">Use</button></div>`).join('');
    out.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>useRelease(Number(b.dataset.add)))}
  catch(e){msg.innerHTML=`<span class="error">${esc(e.message)}</span>`}}
async function useRelease(id){const msg=document.querySelector('#afMsg');msg.textContent='Loading release…';
  try{const j=await api('/api/release/'+id);
    draft.discogsId=String(id);applyRelease(draft,j);
    try{const m=await api('/api/marketplace/'+id);applyHigh(draft,m);
      if(m.available){draft.numForSale=m.numForSale??'';draft.currency=m.lowestPrice?.currency??draft.currency}}catch{}
    renderAdd();document.querySelector('#afMsg').innerHTML='<span class="success">Details filled in from Discogs. Check them, then add the record.</span>'}
  catch(e){msg.innerHTML=`<span class="error">${esc(e.message)}</span>`}}
function saveDraft(){const msg=document.querySelector('#afSaveMsg');
  for(const k of ['artist','release','label','catno','country','year','discogsId'])draft[k]=document.querySelector('#af_'+k).value.trim();
  draft.media=document.querySelector('#af_media').value;draft.sleeve=document.querySelector('#af_sleeve').value;
  if(!draft.artist&&!draft.release){msg.innerHTML='<span class="error">Give it at least an artist or a release title.</span>';return}
  const rec={number:nextNumber(),artist:draft.artist,release:draft.release,label:draft.label,catno:draft.catno,country:draft.country,year:draft.year,
    tracks:draft.tracks||'',unresolved:!(draft.artist&&draft.release&&draft.label&&draft.catno&&draft.year),
    discogsId:draft.discogsId,media:draft.media,sleeve:draft.sleeve,numForSale:draft.numForSale??'',lowestPrice:'',
    highestPrice:draft.highestPrice??'',highestCondition:draft.highestCondition??'',currency:draft.currency??'',
    price:'',photo:draft.photo||'',discogsUrl:draft.discogsUrl||'',marketplaceStatus:draft.discogsId?'Linked':'Pending',
    suggestionsReason:draft.suggestionsReason||''};
  const t=priceTarget(rec);if(t!==null)rec.price=t.toFixed(2);
  rows.push(rec);
  try{localStorage.setItem(STORAGE,JSON.stringify(rows))}
  catch(err){
    if(rec.photo){rec.photo='';
      try{localStorage.setItem(STORAGE,JSON.stringify(rows));msg.innerHTML='<span class="error">Record added, but the photo would not fit in this device\'s storage and was dropped.</span>'}
      catch{rows.pop();msg.innerHTML='<span class="error">This device\'s storage is full. Export a backup and reset the catalog to free space.</span>';return}}
    else{rows.pop();msg.innerHTML='<span class="error">This device\'s storage is full. Export a backup to free space.</span>';return}}
  closeAdd();render();
  alert(`Added #${rec.number}: ${rec.artist||'Unknown'} — ${rec.release||'Untitled'}${rec.price?`\nPrice ${rec.currency||'$'} ${rec.price}`:''}`)}

// ---------- Asking prices and for-sale sheet ----------
function applyHigh(r,j){const h=j.highest;if(h&&Number.isFinite(Number(h.value))){r.highestPrice=Number(h.value);r.highestCondition=h.condition||'';if(!r.currency&&h.currency)r.currency=h.currency}
  else{r.highestPrice='';r.highestCondition='';r.suggestionsReason=j.suggestionsReason||''}}
function highMoney(r){const h=num(r.highestPrice);return h===null?'':`${r.currency||'$'} ${h.toFixed(2)}`}
function round2(v){return Math.round(v*100)/100}
// Price = the Discogs high-end suggestion less 20%. The high anchor comes from
// Discogs' condition-based price suggestions; without it there is nothing to
// discount from, so the price is left blank rather than invented.
function priceTarget(r){const high=num(r.highestPrice);
  if(high===null)return null;
  return round2(high*(1-PRICE_DISCOUNT))}
// "Calculate all" fills every derived field it can, then shows the totals.
function calculateAll(){let priceSet=0,noHigh=0,unchanged=0,graded=0,statusSet=0,resolved=0;
  for(const r of rows){
    if(!r.media)  {r.media='VG+';graded++}
    if(!r.sleeve) {r.sleeve='VG+';graded++}
    if(r.currency===''&&num(r.highestPrice)!==null)r.currency='USD';
    const t=priceTarget(r);
    if(t===null)noHigh++;
    else{const cur=num(r.price);
      if(cur!==null&&Math.abs(cur-t)<0.005)unchanged++;
      else{r.price=t.toFixed(2);priceSet++}}
    const complete=Boolean(r.artist&&r.release&&r.label&&r.catno&&r.year);
    if(r.unresolved&&complete){r.unresolved=false;resolved++}
    if(!r.marketplaceStatus){r.marketplaceStatus=r.discogsId?'Linked':'Pending';statusSet++}}
  save();showTotals=true;render();
  document.querySelector('#totals')?.scrollIntoView({behavior:'smooth',block:'nearest'});
  let why='';
  if(noHigh){const reasons=rows.map(r=>r.suggestionsReason).filter(Boolean);
    const top=reasons.length?reasons.sort((a,b)=>reasons.filter(x=>x===b).length-reasons.filter(x=>x===a).length)[0]:'';
    why=top?`\n\nDiscogs says: "${top}"${/seller settings/i.test(top)?'\n\nCondition-based price suggestions are only released to accounts with Discogs seller settings completed. Fill those out at discogs.com/settings/seller, then run "Refresh all from Discogs" and calculate again.':''}`
           :'\n\nRun "Refresh all from Discogs" first so each record has a high-end figure to discount from.'}
  alert(`Calculated everything.\n\n${priceSet} price${priceSet===1?'':'s'} set at 20% below the Discogs high\n${unchanged} already at that price\n${noHigh} skipped — no Discogs high to discount from\n${graded} missing grade${graded===1?'':'s'} defaulted to VG+\n${resolved} marked resolved\n${statusSet} status field${statusSet===1?'':'s'} filled${why}`)}

function forSaleRows(){return rows.filter(r=>num(r.price)!==null)}
function listingLine(r){const bits=[r.label,r.catno,r.country,r.year].filter(Boolean).join(', ');
  return `${r.artist||'Unknown'} - ${r.release||'Untitled'}${bits?` (${bits})`:''} | Media ${r.media}, Sleeve ${r.sleeve} | ${r.currency||'$'} ${num(r.price).toFixed(2)}${r.discogsUrl?` | ${r.discogsUrl}`:''}`}
function openForSale(){const list=forSaleRows();const d=document.querySelector('#drawer'),p=document.querySelector('#panel');
  active=null;d.classList.add('open');
  const total=list.reduce((a,r)=>a+num(r.price),0);
  const cur=[...new Set(list.map(r=>r.currency).filter(Boolean))];
  p.innerHTML=`<div class="panel-head"><div><div class="eyebrow" style="color:#667085">For sale</div><h2>${list.length} record${list.length===1?'':'s'} ready to list</h2></div><button class="close" id="close">×</button></div>
  ${list.length?`<div class="section"><div class="sale-total"><b>${cur.length===1?cur[0]:'$'} ${total.toFixed(2)}</b><span>Total asking value${cur.length>1?` (mixed currencies: ${cur.join(', ')})`:''}</span></div>
  <div class="sale-actions"><button class="btn primary" id="saleCopy">Copy list</button><button class="btn" id="saleXls">Export .xls</button><button class="btn" id="salePrint">Print / PDF</button></div></div>
  <div class="section"><h3>Listings</h3><div class="sale-list">${list.map(r=>`<div class="sale-item"><div class="sale-item-head"><b>${esc(r.artist||'Unknown')} — ${esc(r.release||'Untitled')}</b><span class="sale-price">${esc(r.currency||'$')} ${num(r.price).toFixed(2)}</span></div><div class="sale-meta">${esc([r.label,r.catno,r.country,r.year].filter(Boolean).join(' · ')||'No pressing details')}</div><div class="sale-meta">Media ${esc(r.media)} · Sleeve ${esc(r.sleeve)}${r.highestPrice!==''?` · Discogs high ${esc(highMoney(r))}${r.highestCondition?` (${esc(r.highestCondition)})`:''}`:''}</div>${r.discogsUrl?`<a class="discogs-link" target="_blank" href="${esc(r.discogsUrl)}">Open on Discogs</a>`:''}</div>`).join('')}</div></div>`
  :`<div class="section"><div class="note">No record has an asking price yet. Set one by hand, or use <b>Fill asking prices</b> after a Discogs refresh, and this sheet will build itself.</div></div>`}`;
  document.querySelector('#close').onclick=closeDrawer;d.onclick=e=>{if(e.target===d)closeDrawer()};
  if(list.length){
    document.querySelector('#saleCopy').onclick=async e=>{const text=list.map(listingLine).join('\n');
      try{await navigator.clipboard.writeText(text);e.target.textContent='Copied'}
      catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();e.target.textContent='Copied'}
      setTimeout(()=>{e.target.textContent='Copy list'},1600)};
    document.querySelector('#saleXls').onclick=()=>exportSaleXls(list);
    document.querySelector('#salePrint').onclick=()=>window.print();
  }}
function exportSaleXls(list){const cols=['#','Artist','Release','Label','Catalog Number','Country','Year','Media','Sleeve','Price','Currency','Discogs High','Discogs URL'];
  const body=list.map(r=>[r.number,r.artist,r.release,r.label,r.catno,r.country,r.year,r.media,r.sleeve,num(r.price).toFixed(2),r.currency,r.highestPrice,r.discogsUrl]);
  const table=`<table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${body.map(a=>`<tr>${a.map(v=>`<td>${esc(v??'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  download('Carlos_Vinyl_For_Sale.xls',`<html><head><meta charset="utf-8"><style>table{border-collapse:collapse;font-family:Arial;font-size:10pt}th{background:#0d1b2a;color:#fff;padding:6px;border:1px solid #9aa4b2}td{padding:5px;border:1px solid #c7cdd5}</style></head><body>${table}</body></html>`,'application/vnd.ms-excel')}

// ---------- Totals ----------
function num(v){const n=parseFloat(String(v??'').replace(/[^0-9.\-]/g,''));return Number.isFinite(n)?n:null}
function totals(){const t={total:rows.length,linked:0,priced:0,unresolved:0,highSum:0,estSum:0,estCount:0,noPrice:0,currencies:new Set()};
  for(const r of rows){if(r.discogsId)t.linked++;if(r.unresolved)t.unresolved++;
    const price=num(r.price),high=num(r.highestPrice);
    if(price!==null){t.priced++;t.estSum+=price;t.estCount++;if(r.currency)t.currencies.add(r.currency)}else t.noPrice++;
    if(high!==null)t.highSum+=high}
  return t}
function fmt(n,cur){return `${cur||'$'} ${n.toFixed(2)}`}
function totalsHtml(){if(!showTotals)return '';const t=totals();const cur=t.currencies.size===1?[...t.currencies][0]:'';
  const multi=t.currencies.size>1?`<br>Values span more than one currency (${[...t.currencies].join(', ')}), so the sums below are plain numeric totals and not converted.`:'';
  return `<div class="totals on" id="totals"><h3>Calculated totals</h3><div class="totals-grid">
  <div class="total-cell"><b>${t.total}</b><span>Records in catalog</span></div>
  <div class="total-cell"><b>${t.linked}</b><span>Linked to Discogs</span></div>
  <div class="total-cell"><b>${t.priced}</b><span>With a Discogs price</span></div>
  <div class="total-cell"><b>${t.unresolved}</b><span>Still need verification</span></div>
  <div class="total-cell"><b>${fmt(t.highSum,cur)}</b><span>Sum of Discogs highs</span></div>
  <div class="total-cell"><b>${fmt(t.estSum,cur)}</b><span>Total collection price</span></div>
  <div class="total-cell"><b>${t.estCount?fmt(t.estSum/t.estCount,cur):'—'}</b><span>Average price per record</span></div>
  </div><div class="totals-note">Price is the Discogs high-end suggestion less ${Math.round(PRICE_DISCOUNT*100)}%, or whatever you typed over it. ${t.noPrice} record${t.noPrice===1?'':'s'} carr${t.noPrice===1?'ies':'y'} no price and count as zero — the real total is higher. Nothing here is an appraisal.${multi}</div></div>`}

// ---------- Batch refresh from Discogs ----------
const PACE=1200;
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function norm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'')}
async function api(path){for(let attempt=0;attempt<4;attempt++){const res=await fetch(path);
    if(res.status===429){await sleep(2000*Math.pow(2,attempt));continue}
    const j=await res.json().catch(()=>({}));
    if(!res.ok){const e=new Error(j.error||`Request failed (${res.status})`);e.status=res.status;throw e}
    return j}
  const e=new Error('Discogs rate limit reached, try again in a minute.');e.status=429;throw e}
function applyRelease(r,j){r.artist=j.artists||r.artist;r.release=j.title||r.release;r.year=String(j.year||r.year||'');r.country=j.country||r.country;
  if(j.labels?.[0]){r.label=j.labels[0].name||r.label;r.catno=j.labels[0].catno||r.catno}
  r.discogsUrl=j.uri?(j.uri.startsWith('http')?j.uri:`https://www.discogs.com${j.uri}`):r.discogsUrl;
  r.tracks=(j.tracklist||[]).map(t=>`${t.position} ${t.title}${t.duration?' '+t.duration:''}`.trim()).join('; ')||r.tracks;
  r.unresolved=false}
function confident(r,x){if(r.catno&&x.catno&&norm(r.catno)===norm(x.catno))return true;
  const title=norm(x.title);
  if(r.artist&&r.release&&title.includes(norm(r.artist))&&title.includes(norm(r.release)))return true;
  return false}
function progress(done,total,label){const bar=document.querySelector('#syncBar'),fill=document.querySelector('#syncFill'),txt=document.querySelector('#syncText'),sub=document.querySelector('#syncSub');
  if(!bar)return;bar.classList.add('on');fill.style.width=`${total?Math.round(done/total*100):0}%`;txt.textContent=`${done} / ${total}`;sub.textContent=label||''}
async function syncAll(){if(syncing)return;
  const st=await api('/api/status').catch(()=>null);
  if(!st?.tokenConfigured){alert('Discogs is not connected, so there is nothing to refresh. Add DISCOGS_TOKEN in Vercel and redeploy.');return}
  syncing=true;cancelSync=false;render();
  const list=rows.slice();let done=0,linked=0,pricedN=0,highN=0,noMatch=0,failed=0,skipped=0;
  for(const r of list){
    if(cancelSync)break;
    progress(done,list.length,`${r.artist||'Unknown'} — ${r.release||'untitled'}`);
    try{
      if(!r.discogsId){
        const q=[r.artist,r.release,r.catno].filter(Boolean).join(' ').trim();
        if(!q){skipped++;done++;continue}
        const sr=await api('/api/search?q='+encodeURIComponent(q));await sleep(PACE);
        const hit=(sr.results||[]).find(x=>confident(r,x));
        if(!hit){noMatch++;r.marketplaceStatus='No confident match';done++;continue}
        r.discogsId=String(hit.id);linked++;
      }
      const rel=await api('/api/release/'+r.discogsId);applyRelease(r,rel);await sleep(PACE);
      if(cancelSync)break;
      const m=await api('/api/marketplace/'+r.discogsId);await sleep(PACE);
      applyHigh(r,m);
      if(m.available){r.numForSale=m.numForSale??'';r.lowestPrice=m.lowestPrice?.value??'';r.currency=m.lowestPrice?.currency??'';r.marketplaceStatus='Available';if(m.lowestPrice)pricedN++}
      else{r.marketplaceStatus='Unavailable'}
      if(r.highestPrice!==''&&r.highestPrice!=null)highN++;
    }catch(e){failed++;r.marketplaceStatus=e.status===429?'Rate limited':'Error'}
    done++;progress(done,list.length,`${r.artist||'Unknown'} — ${r.release||'untitled'}`);
    try{localStorage.setItem(STORAGE,JSON.stringify(rows))}catch{}
  }
  syncing=false;showTotals=true;
  try{localStorage.setItem(STORAGE,JSON.stringify(rows))}catch{}
  render();
  const parts=[`${done} of ${list.length} processed`];
  if(linked)parts.push(`${linked} newly linked`);
  if(pricedN)parts.push(`${pricedN} with marketplace data`);
  if(highN)parts.push(`${highN} with a high-end suggestion`);
  if(noMatch)parts.push(`${noMatch} without a confident match`);
  if(skipped)parts.push(`${skipped} skipped (nothing to search on)`);
  if(failed)parts.push(`${failed} failed`);
  if(cancelSync)parts.push('stopped early');
  alert('Discogs refresh finished.\n\n'+parts.join('\n'));
}

function exportJson(){download('Carlos_Vinyl_Inventory.json',JSON.stringify(rows,null,2),'application/json')}
function exportXls(){const cols=['#','Artist','Release','Label','Catalog Number','Country','Year','Media Condition','Sleeve Condition','Discogs ID','Copies For Sale','Discogs High','Currency','Price','Status','Tracks / Notes'];const body=rows.map(r=>[r.number,r.artist,r.release,r.label,r.catno,r.country,r.year,r.media,r.sleeve,r.discogsId,r.numForSale,r.highestPrice,r.currency,r.price,r.unresolved?'Needs verification':r.marketplaceStatus,r.tracks]);const table=`<table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${body.map((a,i)=>`<tr style="${rows[i].unresolved?'background:#fff0c2':''}">${a.map(v=>`<td>${esc(v??'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;const html=`<html><head><meta charset="utf-8"><style>table{border-collapse:collapse;font-family:Arial;font-size:10pt}th{background:#0d1b2a;color:white;font-weight:bold;padding:6px;border:1px solid #9aa4b2}td{padding:5px;border:1px solid #c7cdd5}</style></head><body>${table}</body></html>`;download('Carlos_Vinyl_Inventory.xls',html,'application/vnd.ms-excel')}
function download(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
applyTheme();
render();
