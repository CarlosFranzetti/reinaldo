const initial = [
[1,'Viola','Little Girl','Nervous Records','NE 20478','US','2001','Club Mix; Put Cha Dub; A Small Dub 6:20; Warm Demo Mix 8:31',false],
[2,'The Advent','Panther EP','Kombination Research','KR005 / KRESEARCH 005','UK','1998','Panther 4:08; Black Patch 4:44; True Combo',false],
[3,'Rising High Collective','Fever Called Love','Rising High Records','RSN 57','UK','1993','Hardfloor Mix 7:18; Original Mix 8:29',false],
[4,'Unknown','','','','','','Abstract pink/orange/white label',true],
[5,'Unknown','','','','','','Black/magenta geometric label',true],
[6,'Unknown','Nu Drum Drops Vol. 2','Rey-D Records','','','','White label, barcode 7 67213 19741 4',true],
[7,'Prinni','Peacemaker','Loöq Records','LoQ 008','UK','','',true],
[8,'Ruff Beats Presents DJ Demigod','D-Day E.P.','Ruff Beats Records','RB017','US','1997','OG Live; Violence Within; Dopest First',false],
[9,'Pulse','Shut Up Already!','Bassment Records','BM-0051','US','1987','Fierce Mix 4:10; Samplepella Mix 3:05; Pulsating Mix; Piano Dub',false],
[10,'Various Artists','Lapse Records','Lapse Records','LAPSE001','Germany','2021','Buran 6:31; Ekranoplan 6:36; Every Week 8:02; Happy Trance 7:41',false],
[11,'Genetic Bass','Frustrate E.P.','Djax-Up-Beats','DJAX-UP-131','Netherlands','1991','S-1 4:15; S-2 4:28; S-3 3:44; S-4 3:45',false],
[12,'N-Joi','Malfunction','RCA','RDCC62006-1 / RCA 62006-1','US','1991','Malfunction 4:20; Manic 2:37; Techno Gangsters 3:33',false],
[13,'Unknown','','Nervous Records','','US','','Yellow Nervous label, NOT Storm',true],
[14,'Storm','Storm','Positiva','12TIVDJX 94','UK','1998','Man With No Name Remix; Rollercoaster\'s Pumped Up Mix',false],
[15,'DJ Godfather','Who\'s That DJ?','Databass Records','DB061','US','2005','',false],
[16,'Fit Siegel','','','','','','Dark brown/marbled label',true],
[17,'Jeremiah','Only Dubbin\' On My 808','Grow!','GROW! 26','Austria','2000','Only Dubbin\' On My 808; Un Dia Soleado',false],
[18,'Danger Man','Circulation','Circulation','CM 001','','','Artist/title orientation needs verification',true],
[19,'Allan M','Self Confidence','','','','','Self Confidence; Soho Step; 2Vilas Remix; Malin Genie Remix',true],
[20,'007','Atmosphere','Odyssey Recordings','OD-02','US','1995','Atmosphere (Electro Funk Mix); Electro Beats',true],
[21,'Ibex','The Second Coming / Pandora\'s Box','Ibex Music','','US','2008','Produced by Tony Ollivierra',false],
[22,'Sansibar','Targeted Individuals','Darknet','DN-01 / DN-001','Germany','2020','Liquid Programming; Technology; My Mind; Meri; 4Digitghost; Kaista; Body Rock; Noche',false],
[23,'Hex Hector / Aki Nawaz','Theme From Love / Sunya','Whirling Records','','','','Exact structure unresolved',true],
[24,'Various Artists / Andrew Weatherall','Nine O\'Clock Drop','Nuphonic','NUX151','UK','2000','13-track 2LP compilation',false],
[25,'Various Artists','Brooklyn Swoop','','','US','','Courtesy of Fumero visible, label unresolved',true],
[26,'Unknown','Nothing Changes / Uro / Hauz','2-Inch Single','','','','Exact artist/label/year unresolved',true],
[27,'Disco Invaders','Dropping Drummer','','','','','',true],
[28,'Unknown','Aurora Borealis','','','','','Exact pressing unresolved',true],
[29,'Strait 2 Dat','You\'re In Da House / I Did This 4 Da Shelter','Nervous Records','','US','','',true],
[30,'Wayne Folk','Man Of Many Faces','','','','','',true],
[31,'Smith n Hack','Tribute','Smith n Hack','SMITH001','Germany','2003','No Gimmicks, No Flash; Soul Food; Footstomping Smoker',false],
[32,'Wyatt Earp & Jonas Tempel feat. Stacy Briscoe','Frequency','Hochokai','HR007','US','2003','Original Mix; Ty Tek & Little Mike Remix',false],
[33,'James Hardway','Cool Jazz Mother Fucker EP','Substance','','','','',true],
[34,'DJ Andi K','Spanish Ice / Stop The Music','Version 3.0','#009','','','',true],
[35,'Soulsonic Force','Trans-Europe Express / Planet Rock','Master Cuts','MC-6028','US','','Unofficial 12-inch',true],
[36,'Tito Puente Jr.','Azúcar','La Casa','LC0001','US','','Radio Edit 3:48; Extended House 8:47; Tropi Club Intro 6:18',true],
[37,'Mihigh + Paul K','Unified Field','Melodrom','MELODROM_02','Romania','','Light of Unity 12:59; Inside 12:23',true],
[38,'Unknown','','Airwave','','','','Airwave logo/boombox artwork only',true]
].map(r=>({number:r[0],artist:r[1],release:r[2],label:r[3],catno:r[4],country:r[5],year:r[6],tracks:r[7],unresolved:r[8],discogsId:'',media:'VG+',sleeve:'VG+',numForSale:'',lowestPrice:'',highestPrice:'',highestCondition:'',currency:'',askingPrice:'',discogsUrl:'',marketplaceStatus:'Pending'}));

const STORAGE='carlos-vinyl-inventory-v1';
let rows = load();
let filter='all';
let query='';
let active=null;
const app=document.querySelector('#app');
const THEME_KEY='carlos-vinyl-theme';
let theme=loadTheme();
let showTotals=false;
let askBias=0.85;
let syncing=false;
let cancelSync=false;

function loadTheme(){try{const t=localStorage.getItem(THEME_KEY);if(t==='dark'||t==='light')return t}catch{}
  return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
function applyTheme(){document.documentElement.dataset.theme=theme;const m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',theme==='dark'?'#0a1120':'#0d1b2a')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';try{localStorage.setItem(THEME_KEY,theme)}catch{}applyTheme();render()}

function load(){try{const x=JSON.parse(localStorage.getItem(STORAGE));if(Array.isArray(x)&&x.length)return x}catch{}return structuredClone(initial)}
function save(){localStorage.setItem(STORAGE,JSON.stringify(rows));render();}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function money(r){return r.lowestPrice ? `${r.currency||'$'} ${Number(r.lowestPrice).toFixed(2)}` : ''}
function counts(){return{total:rows.length,resolved:rows.filter(r=>!r.unresolved).length,unresolved:rows.filter(r=>r.unresolved).length,priced:rows.filter(r=>r.lowestPrice).length}}
function filtered(){return rows.filter(r=>{const f=filter==='all'||(filter==='unresolved'&&r.unresolved)||(filter==='priced'&&r.lowestPrice)||(filter==='linked'&&r.discogsId);const hay=[r.number,r.artist,r.release,r.label,r.catno,r.country,r.year].join(' ').toLowerCase();return f&&hay.includes(query.toLowerCase())})}

function render(){const c=counts();app.innerHTML=`<div class="shell"><header class="topbar"><div class="brand"><div><div class="eyebrow">Personal Vinyl Inventory</div><div class="title">Carlos Vinyl Catalog</div><div class="subtitle">Discogs-assisted research, grading, pricing and export</div></div><div class="status-wrap"><div class="status"><span id="tokenDot" class="dot"></span><span id="tokenText">Checking Discogs connection…</span></div><button class="theme-btn" id="themeBtn" type="button" aria-pressed="${theme==='dark'}">${theme==='dark'?'☀️ Light mode':'🌙 Dark mode'}</button></div></div><div class="metrics"><div class="metric"><b>${c.total}</b><span>Total records</span></div><div class="metric"><b>${c.resolved}</b><span>Resolved</span></div><div class="metric"><b>${c.unresolved}</b><span>Needs verification</span></div><div class="metric"><b>${c.priced}</b><span>Marketplace priced</span></div></div></header>
<div class="toolbar"><input id="q" placeholder="Search artist, release, label, catalog number…" value="${esc(query)}"><select id="filter"><option value="all">All records</option><option value="unresolved">Needs verification</option><option value="linked">Discogs linked</option><option value="priced">Marketplace priced</option></select><select id="askBias" title="Where in the price range to place your asking price"><option value="0.7">Asking: conservative (70%)</option><option value="0.85">Asking: near highest (85%)</option><option value="1">Asking: top of range (100%)</option></select><button class="btn" id="fillAsk">Fill asking prices</button><button class="btn" id="forSale">Generate for-sale list</button><button class="btn primary" id="syncAll">${syncing?'Syncing…':'Refresh all from Discogs'}</button><button class="btn" id="calcAll">Calculate all</button><button class="btn" id="xls">Export Excel</button><button class="btn" id="json">Backup JSON</button><button class="btn" id="print">Print / PDF</button><button class="btn" id="reset">Reset catalog</button></div>
<div class="sync-bar${syncing?' on':''}" id="syncBar"><div class="sync-text" id="syncText">Preparing…</div><div class="sync-track"><div class="sync-fill" id="syncFill"></div></div><button class="btn" id="syncCancel" type="button">Stop</button><div class="sync-sub" id="syncSub"></div></div>
<main class="content">${totalsHtml()}<div class="mobile-list">${filtered().map(cardHtml).join('')}${filtered().length?'':'<div class="empty">No records match this filter.</div>'}</div><div class="table-card desktop-table"><div class="table-wrap"><table><thead><tr><th>#</th><th>Artist</th><th>Release</th><th>Label</th><th>Cat #</th><th>Country</th><th>Year</th><th>Media</th><th>Sleeve</th><th>Discogs ID</th><th>For Sale</th><th>Lowest</th><th>Highest</th><th class="ask-col">Ask</th><th>Status</th><th class="actions">Actions</th></tr></thead><tbody>${filtered().map(rowHtml).join('')}</tbody></table>${filtered().length?'':'<div class="empty">No records match this filter.</div>'}</div></div><div class="footer-note">Marketplace fields are populated only when Discogs returns them. Missing or restricted values stay blank instead of being estimated.</div></main><div id="drawer" class="drawer"><div class="panel" id="panel"></div></div></div>`;
const f=document.querySelector('#filter');f.value=filter;f.onchange=e=>{filter=e.target.value;render()};document.querySelector('#q').oninput=e=>{query=e.target.value;render()};document.querySelector('#xls').onclick=exportXls;document.querySelector('#json').onclick=exportJson;document.querySelector('#print').onclick=()=>window.print();document.querySelector('#themeBtn').onclick=toggleTheme;const ab=document.querySelector('#askBias');ab.value=String(askBias);ab.onchange=e=>{askBias=Number(e.target.value)};document.querySelector('#fillAsk').onclick=fillAsking;document.querySelector('#forSale').onclick=openForSale;document.querySelector('#syncAll').onclick=syncAll;document.querySelector('#calcAll').onclick=()=>{showTotals=true;render();document.querySelector('#totals')?.scrollIntoView({behavior:'smooth',block:'nearest'})};document.querySelector('#syncCancel').onclick=()=>{cancelSync=true};document.querySelector('#reset').onclick=()=>{if(confirm('Reset all local edits and restore the original 38-record catalog?')){rows=structuredClone(initial);localStorage.removeItem(STORAGE);render()}};
document.querySelectorAll('[data-edit]').forEach(el=>el.onchange=e=>edit(Number(el.dataset.n),el.dataset.edit,e.target.value));document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openDrawer(Number(b.dataset.open)));document.querySelectorAll('[data-market]').forEach(b=>b.onclick=()=>refreshMarket(Number(b.dataset.market),b));checkStatus();}

function cardHtml(r){const status=r.unresolved?'<span class="tag warn">VERIFY</span>':r.discogsId?'<span class="tag ok">LINKED</span>':'<span class="tag muted">KNOWN</span>';return `<article class="record-card ${r.unresolved?'unresolved':''}"><div class="record-card-head"><div><div class="record-number">#${r.number}</div><div class="record-title">${esc(r.artist||'Unknown')}</div><div class="record-release">${esc(r.release||'Untitled')}</div></div>${status}</div><div class="record-meta"><span>${esc(r.label||'Label unknown')}</span><span>${esc(r.catno||'Cat # unknown')}</span><span>${esc([r.country,r.year].filter(Boolean).join(' · ')||'Year unknown')}</span></div><div class="record-grid"><label>Media<select class="cell-select" data-edit="media" data-n="${r.number}">${['M','NM','VG+','VG','G+','G','F','P'].map(o=>`<option ${r.media===o?'selected':''}>${o}</option>`).join('')}</select></label><label>Sleeve<select class="cell-select" data-edit="sleeve" data-n="${r.number}">${['M','NM','VG+','VG','G+','G','F','P'].map(o=>`<option ${r.sleeve===o?'selected':''}>${o}</option>`).join('')}</select></label><label>For sale<div class="mobile-value">${esc(r.numForSale||'—')}</div></label><label>Lowest<div class="mobile-value">${esc(money(r)||'—')}</div></label><label>Highest<div class="mobile-value">${esc(highMoney(r)||'—')}</div></label><label class="ask-field${num(r.askingPrice)===null?'':' filled'}">Asking<input class="cell-input money ask-input" data-edit="askingPrice" data-n="${r.number}" value="${esc(r.askingPrice)}" placeholder="$"></label><label>Discogs ID<input class="cell-input" data-edit="discogsId" data-n="${r.number}" value="${esc(r.discogsId)}" inputmode="numeric"></label></div><div class="record-actions"><button class="btn primary" data-open="${r.number}">Research</button><button class="btn" data-market="${r.number}" ${r.discogsId?'':'disabled'}>Refresh price</button></div></article>`}

function rowHtml(r){const status=r.unresolved?'<span class="tag warn">VERIFY</span>':r.discogsId?'<span class="tag ok">LINKED</span>':'<span class="tag muted">KNOWN</span>';return `<tr class="${r.unresolved?'unresolved':''}"><td class="num">${r.number}</td>${inputTd(r,'artist',150)}${inputTd(r,'release',170)}${inputTd(r,'label',120)}${inputTd(r,'catno',105)}${inputTd(r,'country',80)}${inputTd(r,'year',58)}${selectTd(r,'media')}${selectTd(r,'sleeve')}<td><input class="cell-input" data-edit="discogsId" data-n="${r.number}" value="${esc(r.discogsId)}" style="width:74px"></td><td class="money">${esc(r.numForSale)}</td><td class="money nowrap">${esc(money(r))}</td><td class="money nowrap">${esc(highMoney(r))}</td><td class="ask-cell${num(r.askingPrice)===null?'':' filled'}"><input class="cell-input money ask-input" data-edit="askingPrice" data-n="${r.number}" value="${esc(r.askingPrice)}" placeholder="$"></td><td>${status}</td><td class="actions"><button class="mini blue" data-open="${r.number}">Research</button> <button class="mini" data-market="${r.number}" ${r.discogsId?'':'disabled'}>Price</button></td></tr>`}
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

// ---------- Asking prices and for-sale sheet ----------
function applyHigh(r,j){const h=j.highest;if(h&&Number.isFinite(Number(h.value))){r.highestPrice=Number(h.value);r.highestCondition=h.condition||'';if(!r.currency&&h.currency)r.currency=h.currency}
  else{r.highestPrice='';r.highestCondition='';r.suggestionsReason=j.suggestionsReason||''}}
function highMoney(r){const h=num(r.highestPrice);return h===null?'':`${r.currency||'$'} ${h.toFixed(2)}`}
function round2(v){return Math.round(v*100)/100}
// Places the asking price inside the observed range, biased toward the high end.
// Needs a high anchor: without one there is nothing to aim "closer to highest" at.
function askTarget(r,bias){const low=num(r.lowestPrice),high=num(r.highestPrice);
  if(high===null)return null;
  if(low===null)return round2(high*bias);
  if(high<=low)return round2(low);
  return round2(low+(high-low)*bias)}
function fillAsking(){let filled=0,noData=0,unchanged=0;
  for(const r of rows){const t=askTarget(r,askBias);
    if(t===null){noData++;continue}
    const cur=num(r.askingPrice);
    if(cur!==null&&Math.abs(cur-t)<0.005){unchanged++;continue}
    r.askingPrice=t.toFixed(2);filled++}
  save();showTotals=true;render();
  const pct=Math.round(askBias*100);
  alert(`Asking prices set at ${pct}% of each record's low-to-high range.\n\n${filled} updated\n${unchanged} already at that price\n${noData} skipped — no Discogs high-end suggestion yet\n\nRun "Refresh all from Discogs" first if most records were skipped.`)}

function forSaleRows(){return rows.filter(r=>num(r.askingPrice)!==null)}
function listingLine(r){const bits=[r.label,r.catno,r.country,r.year].filter(Boolean).join(', ');
  return `${r.artist||'Unknown'} - ${r.release||'Untitled'}${bits?` (${bits})`:''} | Media ${r.media}, Sleeve ${r.sleeve} | ${r.currency||'$'} ${num(r.askingPrice).toFixed(2)}${r.discogsUrl?` | ${r.discogsUrl}`:''}`}
function openForSale(){const list=forSaleRows();const d=document.querySelector('#drawer'),p=document.querySelector('#panel');
  active=null;d.classList.add('open');
  const total=list.reduce((a,r)=>a+num(r.askingPrice),0);
  const cur=[...new Set(list.map(r=>r.currency).filter(Boolean))];
  p.innerHTML=`<div class="panel-head"><div><div class="eyebrow" style="color:#667085">For sale</div><h2>${list.length} record${list.length===1?'':'s'} ready to list</h2></div><button class="close" id="close">×</button></div>
  ${list.length?`<div class="section"><div class="sale-total"><b>${cur.length===1?cur[0]:'$'} ${total.toFixed(2)}</b><span>Total asking value${cur.length>1?` (mixed currencies: ${cur.join(', ')})`:''}</span></div>
  <div class="sale-actions"><button class="btn primary" id="saleCopy">Copy list</button><button class="btn" id="saleXls">Export .xls</button><button class="btn" id="salePrint">Print / PDF</button></div></div>
  <div class="section"><h3>Listings</h3><div class="sale-list">${list.map(r=>`<div class="sale-item"><div class="sale-item-head"><b>${esc(r.artist||'Unknown')} — ${esc(r.release||'Untitled')}</b><span class="sale-price">${esc(r.currency||'$')} ${num(r.askingPrice).toFixed(2)}</span></div><div class="sale-meta">${esc([r.label,r.catno,r.country,r.year].filter(Boolean).join(' · ')||'No pressing details')}</div><div class="sale-meta">Media ${esc(r.media)} · Sleeve ${esc(r.sleeve)}${r.lowestPrice!==''?` · Discogs low ${esc(money(r))}`:''}${r.highestPrice!==''?` · high ${esc(highMoney(r))}${r.highestCondition?` (${esc(r.highestCondition)})`:''}`:''}</div>${r.discogsUrl?`<a class="discogs-link" target="_blank" href="${esc(r.discogsUrl)}">Open on Discogs</a>`:''}</div>`).join('')}</div></div>`
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
function exportSaleXls(list){const cols=['#','Artist','Release','Label','Catalog Number','Country','Year','Media','Sleeve','Asking Price','Currency','Discogs Low','Discogs High','Discogs URL'];
  const body=list.map(r=>[r.number,r.artist,r.release,r.label,r.catno,r.country,r.year,r.media,r.sleeve,num(r.askingPrice).toFixed(2),r.currency,r.lowestPrice,r.highestPrice,r.discogsUrl]);
  const table=`<table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${body.map(a=>`<tr>${a.map(v=>`<td>${esc(v??'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  download('Carlos_Vinyl_For_Sale.xls',`<html><head><meta charset="utf-8"><style>table{border-collapse:collapse;font-family:Arial;font-size:10pt}th{background:#0d1b2a;color:#fff;padding:6px;border:1px solid #9aa4b2}td{padding:5px;border:1px solid #c7cdd5}</style></head><body>${table}</body></html>`,'application/vnd.ms-excel')}

// ---------- Totals ----------
function num(v){const n=parseFloat(String(v??'').replace(/[^0-9.\-]/g,''));return Number.isFinite(n)?n:null}
function totals(){const t={total:rows.length,linked:0,priced:0,unresolved:0,lowestSum:0,askingSum:0,estSum:0,estCount:0,noPrice:0,currencies:new Set()};
  for(const r of rows){if(r.discogsId)t.linked++;if(r.unresolved)t.unresolved++;
    const low=num(r.lowestPrice),ask=num(r.askingPrice);
    if(low!==null){t.priced++;t.lowestSum+=low;if(r.currency)t.currencies.add(r.currency)}
    if(ask!==null)t.askingSum+=ask;
    const est=ask??low;if(est!==null){t.estSum+=est;t.estCount++}else t.noPrice++}
  return t}
function fmt(n,cur){return `${cur||'$'} ${n.toFixed(2)}`}
function totalsHtml(){if(!showTotals)return '';const t=totals();const cur=t.currencies.size===1?[...t.currencies][0]:'';
  const multi=t.currencies.size>1?`<br>Values span more than one currency (${[...t.currencies].join(', ')}), so the sums below are plain numeric totals and not converted.`:'';
  return `<div class="totals on" id="totals"><h3>Calculated totals</h3><div class="totals-grid">
  <div class="total-cell"><b>${t.total}</b><span>Records in catalog</span></div>
  <div class="total-cell"><b>${t.linked}</b><span>Linked to Discogs</span></div>
  <div class="total-cell"><b>${t.priced}</b><span>With a Discogs price</span></div>
  <div class="total-cell"><b>${t.unresolved}</b><span>Still need verification</span></div>
  <div class="total-cell"><b>${fmt(t.lowestSum,cur)}</b><span>Sum of Discogs lowest</span></div>
  <div class="total-cell"><b>${fmt(t.askingSum,cur)}</b><span>Sum of your asking prices</span></div>
  <div class="total-cell"><b>${fmt(t.estSum,cur)}</b><span>Estimated collection value</span></div>
  <div class="total-cell"><b>${t.estCount?fmt(t.estSum/t.estCount,cur):'—'}</b><span>Average per priced record</span></div>
  </div><div class="totals-note">Estimated value uses your asking price where you set one, otherwise the Discogs lowest listed price. ${t.noPrice} record${t.noPrice===1?'':'s'} carr${t.noPrice===1?'ies':'y'} no price at all and count as zero — the real total is higher. Nothing here is an appraisal.${multi}</div></div>`}

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
  if(pricedN)parts.push(`${pricedN} priced`);
  if(highN)parts.push(`${highN} with a high-end suggestion`);
  if(noMatch)parts.push(`${noMatch} without a confident match`);
  if(skipped)parts.push(`${skipped} skipped (nothing to search on)`);
  if(failed)parts.push(`${failed} failed`);
  if(cancelSync)parts.push('stopped early');
  alert('Discogs refresh finished.\n\n'+parts.join('\n'));
}

function exportJson(){download('Carlos_Vinyl_Inventory.json',JSON.stringify(rows,null,2),'application/json')}
function exportXls(){const cols=['#','Artist','Release','Label','Catalog Number','Country','Year','Media Condition','Sleeve Condition','Discogs ID','Copies For Sale','Lowest Price','Highest Price','Currency','Asking Price','Status','Tracks / Notes'];const body=rows.map(r=>[r.number,r.artist,r.release,r.label,r.catno,r.country,r.year,r.media,r.sleeve,r.discogsId,r.numForSale,r.lowestPrice,r.highestPrice,r.currency,r.askingPrice,r.unresolved?'Needs verification':r.marketplaceStatus,r.tracks]);const table=`<table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${body.map((a,i)=>`<tr style="${rows[i].unresolved?'background:#fff0c2':''}">${a.map(v=>`<td>${esc(v??'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;const html=`<html><head><meta charset="utf-8"><style>table{border-collapse:collapse;font-family:Arial;font-size:10pt}th{background:#0d1b2a;color:white;font-weight:bold;padding:6px;border:1px solid #9aa4b2}td{padding:5px;border:1px solid #c7cdd5}</style></head><body>${table}</body></html>`;download('Carlos_Vinyl_Inventory.xls',html,'application/vnd.ms-excel')}
function download(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
applyTheme();
render();
