"""dashboard.html — full-detail layer, interactive, single self-contained file.

Laptop (>=900px): sortable table, sticky filter bar, click a row for a detail panel.
Phone (<900px): stacked cards, tap for full detail, filters in a drawer, no
horizontal scroll, 44px touch targets.
Every field of every usable programme is embedded, so the completeness check
passes against this file as well as against the dossiers.
"""
import sys, json
sys.path.insert(0, "build")
from pathlib import Path
from data import load, PATH_COLOR, PATH_NAME

rows = [r for r in load() if r["usable"]]
KEEP = [k for k in rows[0] if not k.startswith("_") and k not in
        ("paths", "fee_num", "deadline_date", "deadline_conf", "deadline_label", "usable")]
data = []
for r in rows:
    d = {k: r[k] for k in KEEP}
    d["_d"] = r["deadline_date"].isoformat() if r["deadline_date"] else ""
    d["_dc"] = r["deadline_conf"]
    d["_fee"] = r["fee_num"] if r["fee_num"] is not None else -1
    data.append(d)

CSS = """
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
:root{--ink:#EDEBE7;--bg:#16161E;--panel:#1E1E28;--panel2:#25252F;--accent:#E0603A;
      --muted:#8A8A99;--rule:#33333F;--ok:#5FA88C;--warn:#D9954A;--bad:#E0603A}
html,body{margin:0;padding:0;background:var(--bg);color:var(--ink);overflow-x:hidden}
body{font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
h1{font-family:Georgia,"Times New Roman",serif;font-size:26px;margin:0 0 4px;letter-spacing:-.02em}
a{color:var(--accent)}
.wrap{max-width:1600px;margin:0 auto;padding:18px 16px 64px}
.sub{color:var(--muted);font-size:13px;margin-bottom:14px}
.bar{position:sticky;top:0;z-index:30;background:var(--bg);border-bottom:1px solid var(--rule);
     padding:10px 0;margin-bottom:12px}
.filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
select,input{background:var(--panel);color:var(--ink);border:1px solid var(--rule);
     border-radius:8px;padding:9px 10px;font-size:13px;min-height:40px}
input{flex:1 1 220px;min-width:0}
.count{color:var(--accent);font-weight:600;font-size:13px;white-space:nowrap}
.btn{background:var(--panel);border:1px solid var(--rule);color:var(--ink);border-radius:8px;
     padding:11px 14px;font-size:14px;min-height:44px;cursor:pointer}
.btn:active{background:var(--panel2)}
#drawerBtn{display:none}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:9px 8px;color:var(--muted);font-size:11px;letter-spacing:.08em;
   text-transform:uppercase;border-bottom:1px solid var(--rule);cursor:pointer;white-space:nowrap;
   position:sticky;top:62px;background:var(--bg);z-index:20}
th:hover{color:var(--accent)}
td{padding:9px 8px;border-bottom:1px solid var(--rule);vertical-align:top}
tr.r{cursor:pointer}
tr.r:hover td{background:var(--panel)}
.badge{display:inline-block;padding:2px 7px;border-radius:5px;font-size:11px;color:#fff;
       font-weight:600;margin-right:3px}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;
      border:1px solid var(--rule);color:var(--muted)}
.v-VERIFIED{background:var(--ok)}.v-PARTIALLY_VERIFIED{background:var(--warn)}
.v-UNVERIFIED,.v-CONFLICT,.v-DEAD_LINK{background:var(--bad)}
.cards{display:none}
.card{background:var(--panel);border-left:3px solid var(--accent);border-radius:10px;
      padding:13px;margin-bottom:10px}
.card h3{margin:0 0 4px;font-size:15px;line-height:1.3}
.card .meta{color:var(--muted);font-size:12.5px;margin-bottom:8px}
.card .row{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;padding:3px 0}
.card .k{color:var(--muted)}
.detail{position:fixed;inset:0;background:rgba(8,8,12,.72);z-index:60;display:none;
        overflow-y:auto;padding:16px}
.detail.open{display:block}
.sheet{max-width:960px;margin:24px auto;background:var(--panel);border-radius:14px;padding:20px}
.sheet h2{margin:0 0 2px;font-family:Georgia,serif;font-size:21px;line-height:1.25}
.sheet .inst{color:var(--muted);margin-bottom:12px}
.kv{display:grid;grid-template-columns:210px 1fr;gap:5px 14px;font-size:13px}
.kv .k{color:var(--muted);word-break:break-word}
.kv .v{word-break:break-word;overflow-wrap:anywhere}
.close{position:sticky;top:0;float:right;background:var(--panel2);border:1px solid var(--rule);
       color:var(--ink);border-radius:8px;min-width:44px;min-height:44px;font-size:18px;cursor:pointer}
.drawer{position:fixed;inset:0;background:rgba(8,8,12,.75);z-index:70;display:none;padding:16px}
.drawer.open{display:block}
.dsheet{background:var(--panel);border-radius:14px;padding:16px;max-width:520px;margin:12px auto}
.dsheet label{display:block;color:var(--muted);font-size:12px;margin:10px 0 4px}
.dsheet select,.dsheet input{width:100%}
@media (max-width:900px){
  .wrap{padding:14px 12px 48px}
  h1{font-size:21px}
  table{display:none}
  .cards{display:block}
  .filters{display:none}
  #drawerBtn{display:block;width:100%}
  .bar{display:flex;gap:10px;align-items:center}
  .kv{grid-template-columns:1fr;gap:2px 0}
  .kv .k{margin-top:8px;font-size:11.5px;text-transform:uppercase;letter-spacing:.05em}
  .sheet{padding:15px;margin:0 auto}
}
"""

JS = """
const D=DATA, PC=PATHC, PN=PATHN;
let sortKey='_d', sortAsc=true;
const $=s=>document.querySelector(s);
const uniq=(f)=>[...new Set(D.flatMap(f).filter(Boolean))].sort();
function fillSel(id,vals,label){const s=document.querySelectorAll(id);
  vals.forEach(v=>s.forEach(el=>{const o=document.createElement('option');o.value=v;o.textContent=v;el.appendChild(o);}));}
// the phone drawer carries a parallel set of controls; read whichever the
// viewer actually touched, and mirror it back so the two never disagree
function g(id){const a=document.querySelector(id),b=document.querySelector(id+'2');
  const va=a?a.value:'',vb=b?b.value:'';return va||vb;}
function mirror(el){const id=el.id;const other=id.endsWith('2')
  ?document.getElementById(id.slice(0,-1)):document.getElementById(id+'2');
  if(other&&other.value!==el.value)other.value=el.value;}
function state(){
  return {p:g('#fPath'),c:g('#fCity'),l:g('#fLang'),f:g('#fFund'),v:g('#fVer'),
          d:g('#fDead'),q:(g('#fQ')||'').toLowerCase()};}
function match(r){const s=state();
  if(s.p&&!r.path_letter.split(',').includes(s.p))return false;
  if(s.c&&r.city!==s.c)return false;
  if(s.l&&!(r.language_of_instruction||'').toLowerCase().includes(s.l.toLowerCase()))return false;
  if(s.f&&r.scholarship_coverage_level!==s.f)return false;
  if(s.v&&r.verification_status!==s.v)return false;
  if(s.d){if(!r._d)return false;const t=new Date(r._d),n=new Date('2026-08-22');
    const days=(t-n)/864e5; if(s.d==='90'&&days>90)return false; if(s.d==='180'&&days>180)return false;
    if(s.d==='365'&&days>365)return false;}
  if(s.q){const hay=Object.values(r).join(' ').toLowerCase(); if(!hay.includes(s.q))return false;}
  return true;}
function chips(r){return r.path_letter.split(',').filter(Boolean)
  .map(p=>`<span class="badge" style="background:${PC[p]||'#5C5C68'}">${p}</span>`).join('');}
function fee(r){return r.tuition_non_eu_eur_per_year||'—';}
function render(){
  const list=D.filter(match).sort((a,b)=>{
    let x=a[sortKey]??'',y=b[sortKey]??'';
    if(sortKey==='_fee'){x=a._fee;y=b._fee;}
    // unknowns sink in BOTH directions — sorting by price to find the cheapest
    // should not hand back a screen of TBC
    const mx=(x===''||x===-1), my=(y===''||y===-1);
    if(mx&&!my)return 1; if(my&&!mx)return -1; if(mx&&my)return 0;
    return (x>y?1:x<y?-1:0)*(sortAsc?1:-1);});
  $('#count').textContent=list.length+' of '+D.length+' programmes';
  $('#tbody').innerHTML=list.map((r,i)=>`<tr class="r" data-i="${D.indexOf(r)}">
    <td>${chips(r)}</td><td><b>${esc(r.program_name)}</b></td>
    <td>${esc(r.institution)}</td><td>${esc(r.city)}</td>
    <td>${esc(r.language_of_instruction.slice(0,34))}</td>
    <td>${esc(fee(r))}</td>
    <td>${r._d?esc(r._d):'<span class="pill">TBC</span>'}${r._d&&r._dc!=='confirmed_2027'?' <span class="pill">unconf.</span>':''}</td>
    <td><span class="pill">${esc(r.scholarship_coverage_level)}</span></td>
    <td><span class="badge v-${r.verification_status}">${r.verification_status.replace(/_/g,' ')}</span></td>
  </tr>`).join('');
  $('#cards').innerHTML=list.map(r=>`<div class="card" data-i="${D.indexOf(r)}" style="border-left-color:${PC[r.path_letter.split(',')[0]]||'#E0603A'}">
    <h3>${esc(r.program_name)}</h3>
    <div class="meta">${esc(r.institution)}<br>${esc(r.city)}, ${esc(r.country)}</div>
    <div>${chips(r)} <span class="badge v-${r.verification_status}">${r.verification_status.replace(/_/g,' ')}</span></div>
    <div class="row"><span class="k">Tuition / yr</span><span>${esc(fee(r))}</span></div>
    <div class="row"><span class="k">Deadline</span><span>${r._d?esc(r._d)+(r._dc!=='confirmed_2027'?' (unconf.)':''):'TBC'}</span></div>
    <div class="row"><span class="k">Funding</span><span>${esc(r.scholarship_coverage_level)}</span></div>
    <div class="row"><span class="k">Accepts his degree</span><span>${esc(r.accepts_engineering_bachelor)}</span></div>
  </div>`).join('');
}
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function open_(i){const r=D[i];
  $('#sheet').innerHTML=`<button class="close" onclick="closeDetail()">✕</button>
   <h2>${esc(r.program_name)}</h2><div class="inst">${esc(r.institution)} · ${esc(r.city)}, ${esc(r.country)}</div>
   <div>${chips(r)} <span class="badge v-${r.verification_status}">${r.verification_status.replace(/_/g,' ')}</span></div>
   <div class="kv" style="margin-top:14px">`+
   Object.keys(r).filter(k=>!k.startsWith('_')&&r[k]).map(k=>{
     const v=r[k]; const isU=/^https?:\\/\\//.test(v);
     const val=isU?`<a href="${esc(v)}" target="_blank" rel="noopener">${esc(v)}</a>`
       :(k==='source_urls'?v.split('|').filter(Boolean).map(u=>`<a href="${esc(u.trim())}" target="_blank" rel="noopener">${esc(u.trim())}</a>`).join('<br>'):esc(v));
     return `<div class="k">${esc(k.replace(/_/g,' '))}</div><div class="v">${val}</div>`;}).join('')
   +`</div>`;
  $('#detail').classList.add('open'); document.body.style.overflow='hidden';}
function closeDetail(){$('#detail').classList.remove('open');document.body.style.overflow='';}
function toggleDrawer(){const d=$('#drawer');d.classList.toggle('open');}
document.addEventListener('click',e=>{
  const tr=e.target.closest('tr.r'); if(tr){open_(+tr.dataset.i);return;}
  const c=e.target.closest('.card'); if(c){open_(+c.dataset.i);return;}
  if(e.target.id==='detail')closeDetail();
  if(e.target.id==='drawer')toggleDrawer();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDetail();}});
window.addEventListener('DOMContentLoaded',()=>{
  fillSel('.selPath',uniq(r=>r.path_letter.split(',')));
  fillSel('.selCity',uniq(r=>[r.city]));
  fillSel('.selLang',uniq(r=>[(r.language_of_instruction||'').split(/[;(,]/)[0].trim()]).filter(x=>x));
  fillSel('.selFund',uniq(r=>[r.scholarship_coverage_level]));
  fillSel('.selVer',uniq(r=>[r.verification_status]));
  document.querySelectorAll('select,input').forEach(el=>el.addEventListener('input',()=>{mirror(el);render();}));
  document.querySelectorAll('th[data-k]').forEach(th=>th.addEventListener('click',()=>{
    const k=th.dataset.k; sortAsc = (k===sortKey)?!sortAsc:true; sortKey=k; render();}));
  render();});
"""

def sel(idn, cls, label):
    return f'<select id="{idn}" class="{cls}"><option value="">{label}</option></select>'

FILTERS = (sel("fPath","selPath","All paths") + sel("fCity","selCity","All cities") +
           sel("fLang","selLang","All languages") + sel("fFund","selFund","Any funding") +
           sel("fVer","selVer","Any verification") +
           '<select id="fDead"><option value="">Any deadline</option>'
           '<option value="90">Within 90 days</option><option value="180">Within 180 days</option>'
           '<option value="365">Within a year</option></select>'
           '<input id="fQ" placeholder="Search every field…">')

HTML = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Master's 2027 — programme dashboard</title><style>{CSS}</style></head><body>
<div class="wrap">
 <h1>Master's 2027 — programme dashboard</h1>
 <div class="sub">{len(rows)} verified and partially-verified programmes · Spain, Netherlands, Berlin ·
  built 2026-08-22. Unverified programmes are deliberately absent; they are listed only in the risk
  section of the Decision Brief.</div>
 <div class="bar">
  <button class="btn" id="drawerBtn" onclick="toggleDrawer()">Filters &amp; search</button>
  <div class="filters">{FILTERS}<span class="count" id="count"></span></div>
 </div>
 <table>
  <thead><tr>
   <th data-k="path_letter">Paths</th><th data-k="program_name">Programme</th>
   <th data-k="institution">Institution</th><th data-k="city">City</th>
   <th data-k="language_of_instruction">Language</th><th data-k="_fee">Tuition/yr</th>
   <th data-k="_d">Deadline</th><th data-k="scholarship_coverage_level">Funding</th>
   <th data-k="verification_status">Verified</th>
  </tr></thead><tbody id="tbody"></tbody></table>
 <div class="cards" id="cards"></div>
</div>
<div class="detail" id="detail"><div class="sheet" id="sheet"></div></div>
<div class="drawer" id="drawer"><div class="dsheet">
  <button class="btn" style="width:100%" onclick="toggleDrawer()">Done</button>
  <label>Path</label>{sel("fPath2","selPath","All paths")}
  <label>City</label>{sel("fCity2","selCity","All cities")}
  <label>Language</label>{sel("fLang2","selLang","All languages")}
  <label>Funding</label>{sel("fFund2","selFund","Any funding")}
  <label>Verification</label>{sel("fVer2","selVer","Any verification")}
  <label>Search</label><input id="fQ2" placeholder="Search every field…">
</div></div>
<script>const DATA={json.dumps(data, ensure_ascii=False)};
const PATHC={json.dumps(PATH_COLOR)};const PATHN={json.dumps(PATH_NAME)};
{JS}</script></body></html>"""

out = Path("deliverables/tools/dashboard.html")
out.write_text(HTML, encoding="utf-8")
print(f"dashboard.html — {len(rows)} programmes, {out.stat().st_size//1024} KB")
