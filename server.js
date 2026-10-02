const express = require('express');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '20kb' }));
const HTML = "<!DOCTYPE html>\n<html lang=\"vi\"><head><meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n<title>Genie đoán nhân vật</title>\n<style>\n:root{--bg1:#120a2e;--bg2:#2a1260;--gold:#ffc94d;--ink:#f6f3ff;--mut:#b4a9e0;--line:#ffffff26;--glass:#ffffff12}\n@media(prefers-color-scheme:light){:root{--bg1:#120a2e;--bg2:#2a1260}}\n*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}\nhtml,body{min-height:100%;margin:0}\nbody{background:radial-gradient(800px 500px at 50% -10%,#7a3fff55,transparent),linear-gradient(170deg,var(--bg1),var(--bg2));color:var(--ink);font:16px/1.45 \"Be Vietnam Pro\",system-ui,-apple-system,sans-serif;padding:env(safe-area-inset-top) 14px calc(24px + env(safe-area-inset-bottom));background-attachment:fixed}\nmain{max-width:480px;margin:0 auto;text-align:center}\nh1{margin:14px 0 0;font-size:24px;letter-spacing:-.01em}\n.sub{color:var(--mut);font-size:14px}\n#genie{font-size:92px;line-height:1;margin:6px 0;filter:drop-shadow(0 0 28px #8a5cff);animation:fl 3s ease-in-out infinite}\n@keyframes fl{50%{transform:translateY(-10px) rotate(-3deg)}}\n.card{background:var(--glass);border:1px solid var(--line);border-radius:22px;padding:18px;backdrop-filter:blur(10px)}\n.q{font-size:20px;font-weight:700;min-height:84px;display:grid;place-items:center;margin:6px 0 14px}\nbutton{font:inherit;color:inherit;border:1px solid var(--line);background:#ffffff14;border-radius:14px;padding:13px;cursor:pointer;width:100%;margin-top:8px;transition:transform .1s,background .15s}\nbutton:active{transform:scale(.97)}button:hover{background:#ffffff26}\n.yes{background:linear-gradient(135deg,#7c5cff,#4f8bff);border:0;font-weight:700}\n.no{background:linear-gradient(135deg,#ff5d7a,#ff8a5c);border:0;font-weight:700}\n.row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.row button{margin-top:8px}\n.bar{height:7px;border-radius:5px;background:#ffffff1f;overflow:hidden;margin:4px 0 12px}.bar i{display:block;height:100%;background:linear-gradient(90deg,#27e0b5,var(--gold));transition:width .4s}\n.big{font-size:70px;margin:4px 0}\n.nm{font-size:26px;font-weight:800;color:var(--gold)}\ninput{width:100%;padding:13px;border-radius:12px;border:1px solid var(--line);background:#0004;color:var(--ink);font:inherit;outline:0;margin-top:8px}\n.link{background:none;border:0;color:var(--mut);font-size:14px;width:auto;margin:10px auto 0;display:block}\n.mut{color:var(--mut);font-size:13px}\n</style></head><body><main>\n<h1>🔮 Genie đoán nhân vật</h1>\n<div class=\"sub\">Hãy nghĩ đến một nhân vật, mình sẽ đoán ra!</div>\n<div id=\"genie\">🧞</div>\n<div class=\"card\" id=\"s\"></div>\n<div class=\"mut\" id=\"foot\" style=\"margin-top:12px\"></div>\n</main>\n<script>\nconst Q=[['real','Nhân vật này là người thật (không phải hư cấu)?'],['male','Nhân vật là nam?'],['vn','Là người Việt Nam hoặc gắn với Việt Nam?'],['alive','Hiện giờ vẫn còn sống?'],['sing','Là ca sĩ hoặc nhạc sĩ?'],['act','Là diễn viên hoặc người nổi tiếng trên màn ảnh?'],['sport','Liên quan đến thể thao?'],['football','Chơi bóng đá?'],['pol','Là lãnh đạo, chính trị gia hoặc tướng lĩnh trong lịch sử?'],['sci','Là nhà khoa học, nhà phát minh hoặc doanh nhân công nghệ?'],['write','Là nhà văn hoặc nhà thơ?'],['anime','Xuất hiện trong anime/manga?'],['cartoon','Là nhân vật hoạt hình phương Tây (Disney, Pixar, Nickelodeon…)?'],['movie','Xuất hiện trong phim điện ảnh?'],['game','Xuất hiện trong trò chơi điện tử?'],['super','Có siêu năng lực hoặc phép thuật?'],['animal','Là động vật hoặc sinh vật không phải người?'],['evil','Là nhân vật phản diện / xấu xa?'],['hero','Là anh hùng, người tốt đi cứu người khác?'],['kid','Là trẻ em hoặc trông như trẻ em?'],['glass','Đeo kính?'],['hat','Thường đội mũ?'],['mask','Mặc trang phục hoặc đeo mặt nạ đặc biệt?'],['blackhair','Tóc đen?'],['blond','Tóc vàng?'],['bald','Hói hoặc không có tóc?'],['mcu','Thuộc vũ trụ siêu anh hùng Marvel hoặc DC?'],['robot','Là robot hoặc người máy?'],['princess','Là công chúa, hoàng tử hoặc hoàng gia?'],['detect','Liên quan đến phá án, thám tử?'],['war','Gắn với chiến tranh hoặc quân sự?'],['tech','Gắn với một công ty công nghệ nổi tiếng?']];\nconst LQ=Object.fromEntries(Q);Object.assign(LQ,{female:'Là nữ?',dead:'Đã qua đời?',fame:'Rất nổi tiếng trên khắp thế giới?'});\nfunction qtext(t){if(LQ[t])return LQ[t];const i=t.indexOf(':');if(i<0)return null;const k=t.slice(0,i),v=t.slice(i+1);\n return({occ:`Là ${v}?`,c:`Mang quốc tịch ${v}?`,b:`Sinh trong thập niên ${v}?`,bc:`Sinh vào thế kỷ ${v}?`,k:`Là nhân vật ${v}?`,u:`Thuộc vũ trụ / thương hiệu «${v}»?`,w:`Xuất hiện trong «${v}»?`})[k]||null}\nlet ENT=[],TAGS={},TL=[],P,asked,ans,hist,wrong,info={};\nconst $=s=>document.querySelector(s),sc=$('#s'),W=[1,.75,.5,.25,0];\nasync function load(){\n  sc.innerHTML='<div class=\"q\">Đang gọi Genie…</div>';\n  try{const r=await fetch('/api/data');info=await r.json();ENT=info.d.map(x=>({n:x[0],e:x[1],t:x[2].split('|'),s:x[3]}))}\n  catch{sc.innerHTML='<div class=\"q\">Không kết nối được máy chủ.</div><button class=\"yes\" onclick=\"load()\">Thử lại</button>';return}\n  TAGS={};ENT.forEach((x,i)=>x.t.forEach(t=>(TAGS[t]=TAGS[t]||[]).push(i)));\n  const mn=ENT.length<300?1:5;\n  TL=Object.keys(TAGS).filter(t=>TAGS[t].length>=mn&&TAGS[t].length<=ENT.length-mn&&qtext(t));\n  $('#foot').textContent=`Genie biết ${ENT.length} nhân vật`+(info.ready?'':' · '+info.status+' — tải lại trang sau vài phút để có nhiều hơn');\n  start();\n}\nfunction norm(){let t=0;for(const p of P)t+=p;if(t>0)for(let i=0;i<P.length;i++)P[i]/=t;return t}\nfunction start(){P=new Float64Array(ENT.length);ENT.forEach((x,i)=>P[i]=1+Math.log(1+(x.s||1)));asked=[];ans={};hist=[];wrong=0;norm();$('#genie').textContent='🧞';step()}\nfunction best(){let b=null,bd=.48;for(const t of TL){if(ans[t]!==undefined)continue;let y=0;for(const i of TAGS[t])y+=P[i];const d=Math.abs(y-.5)+Math.random()*.03;if(d<bd){bd=d;b=t}}return b}\nfunction argmax(){let m=0;for(let i=1;i<P.length;i++)if(P[i]>P[m])m=i;return m}\nfunction step(){\n  const top=argmax(),mx=P[top],n=asked.length,q=best();\n  if(!(mx>0))return learn();\n  if((mx>=.8&&n>=5)||n>=30||!q)return guess(top);\n  sc.innerHTML=`<div class=\"mut\">Câu ${n+1}</div><div class=\"bar\"><i style=\"width:${Math.min(100,mx*100)}%\"></i></div>\n  <div class=\"q\">${qtext(q)}</div>\n  <button class=\"yes\" data-a=\"0\">Có</button>\n  <div class=\"row\"><button data-a=\"1\">Chắc là có</button><button data-a=\"3\">Chắc là không</button></div>\n  <button data-a=\"2\">Không biết</button><button class=\"no\" data-a=\"4\">Không</button>\n  ${n?'<button class=\"link\" id=\"undo\">↶ Quay lại</button>':''}`;\n  sc.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>answer(q,W[+b.dataset.a]));\n  const u=$('#undo');if(u)u.onclick=()=>{const h=hist.pop();P=h.P;asked=h.asked;ans=h.ans;step()};\n  $('#genie').textContent=mx>.4?'🧞‍♂️':'🧞';\n}\nfunction answer(q,a){\n  hist.push({P:Float64Array.from(P),asked:[...asked],ans:{...ans}});asked.push(q);ans[q]=a;\n  if(a!==.5){const fy=.04+.92*a,fn=.04+.92*(1-a),r=fy/fn;for(let i=0;i<P.length;i++)P[i]*=fn;for(const i of TAGS[q])P[i]*=r}\n  norm();step();\n}\nfunction guess(i){\n  const x=ENT[i];\n  sc.innerHTML=`<div class=\"mut\">Mình nghĩ là…</div><div class=\"big\">${x.e}</div><div class=\"nm\"></div>\n  <div class=\"mut\" style=\"margin:6px 0 4px\">Mình đoán sau ${asked.length} câu hỏi</div>\n  <button class=\"yes\" id=\"ok\">✅ Đúng rồi!</button><button class=\"no\" id=\"ko\">❌ Không phải</button>`;\n  sc.querySelector('.nm').textContent=x.n;\n  $('#ok').onclick=()=>{$('#genie').textContent='🥳';sc.innerHTML=`<div class=\"big\">🎉</div><div class=\"nm\"></div><div class=\"mut\" style=\"margin:8px 0\">Mình đoán đúng sau ${asked.length} câu!</div><button class=\"yes\" id=\"again\">Chơi lại</button>`;sc.querySelector('.nm').textContent=x.n;$('#again').onclick=start};\n  $('#ko').onclick=()=>{wrong++;P[i]=0;if(wrong>=3||norm()<=0)learn();else{$('#genie').textContent='🤔';step()}};\n}\nfunction learn(){\n  $('#genie').textContent='😅';\n  sc.innerHTML=`<div class=\"nm\" style=\"font-size:22px\">Mình chịu thua!</div><div class=\"mut\" style=\"margin:6px 0\">Bạn đang nghĩ đến ai? Dạy mình để lần sau mọi người đều được đoán đúng.</div>\n  <input id=\"nn\" placeholder=\"Tên nhân vật\" maxlength=\"40\"><button class=\"yes\" id=\"teach\">Dạy cho Genie</button><button class=\"link\" id=\"skip\">Bỏ qua, chơi lại</button>`;\n  $('#teach').onclick=async()=>{const v=$('#nn').value.trim();if(!v)return;\n    const tags=Object.keys(ans).filter(k=>ans[k]>=.75);\n    try{await fetch('/api/learn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:v,tags})})}catch{}\n    load()};\n  $('#skip').onclick=start;\n}\nload();\n</script></body></html>";

/* ============ Dữ liệu ============ */
// Dữ liệu dự phòng (dùng khi chưa tải được Wikidata)
const BASE = [
['Hồ Chí Minh','👴','real male vn pol'],['Sơn Tùng M-TP','🎤','real male vn alive sing'],['Messi','⚽','real male alive sport football'],
['Cristiano Ronaldo','🏆','real male alive sport football blackhair'],['Nguyễn Quang Hải','🇻🇳','real male vn alive sport football blackhair'],
['Michael Jackson','🕺','real male sing hat blackhair'],['Albert Einstein','🧠','real male sci'],['Elon Musk','🚀','real male alive sci tech'],
['Bill Gates','💻','real male alive sci glass tech'],['Taylor Swift','🎸','real alive sing blond'],['Jackie Chan','🥋','real male alive act'],
['Bruce Lee','🥊','real male act sport'],['Charlie Chaplin','🎩','real male act hat'],['Trấn Thành','🎬','real male vn alive act'],
['Mỹ Tâm','🎶','real vn alive sing'],['Nguyễn Du','📜','real male vn write'],['Trần Hưng Đạo','⚔️','real male vn pol war'],
['Napoleon','👑','real male pol hat war'],['Marilyn Monroe','💋','real act blond'],['LeBron James','🏀','real male alive sport'],
['Stephen Hawking','🌌','real male sci glass'],['Steve Jobs','🍎','real male sci glass tech'],
['Doraemon','🤖','anime robot super hero'],['Nobita','👓','anime male kid glass'],['Son Goku','🐉','anime male super hero blackhair'],
['Naruto','🍥','anime male super hero blond'],['Luffy','🏴‍☠️','anime male super hero hat blackhair'],['Pikachu','⚡','anime game animal super hero'],
['Conan Edogawa','🔍','anime male kid glass detect hero'],['Shin cậu bé bút chì','✏️','anime male kid blackhair'],
['Spider-Man','🕷️','movie male super hero mask mcu'],['Iron Man','🦾','movie male hero mask mcu sci'],['Batman','🦇','movie male hero mask mcu blackhair'],
['Superman','🦸','movie male super hero mask mcu blackhair'],['Thor','🔨','movie male super hero mcu blond'],['Wonder Woman','🛡️','movie super hero mask mcu princess blackhair'],
['Joker','🃏','movie male evil mcu'],['Harry Potter','⚡','movie male super glass kid hero blackhair'],['Voldemort','🐍','movie male super evil bald'],
['Darth Vader','🌑','movie male evil mask super war'],['Sherlock Holmes','🕵️','movie male detect hat hero'],['Shrek','👹','cartoon movie male hero bald'],
['Elsa','❄️','cartoon movie princess super blond'],['Mickey Mouse','🐭','cartoon animal male hero'],['SpongeBob','🧽','cartoon male'],
['Mario','🍄','game male hat hero'],['Sonic','💨','game animal super hero'],['Thánh Gióng','🐎','vn male super hero kid']];
const CACHE = path.join(__dirname, 'cache.json');
const LFILE = path.join(__dirname, 'learned.json');
const UA = 'AkinatorVN/1.0 (Render app; ' + (process.env.CONTACT || 'contact: set CONTACT env') + ')';

let DATA = BASE.map((e) => [e[0], e[1], e[2].split(' ').join('|'), 100]);
let ready = false, status = 'Đang nạp dữ liệu từ Wikidata…';
let LEARN = [];
try { LEARN = JSON.parse(fs.readFileSync(LFILE, 'utf8')); } catch {}
try {
  const c = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  if (c.t > Date.now() - 7 * 864e5 && c.d.length > 300) { DATA = c.d; ready = true; status = 'Dữ liệu từ bộ nhớ đệm'; }
} catch {}

let BUF = null;
function rebuild() {
  const d = [...DATA, ...LEARN];
  BUF = zlib.gzipSync(JSON.stringify({ ready, status, n: d.length, d }));
}
rebuild();

/* ============ Tải Wikidata ============ */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function sparql(q, retry = 1) {
  const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q);
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' }, signal: AbortSignal.timeout(70000) });
  if (r.status === 429 && retry > 0) { await sleep(30000); return sparql(q, retry - 1); }
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return (await r.json()).results.bindings;
}
const OCC = [['Q33999', 'diễn viên'], ['Q10800557', 'diễn viên điện ảnh'], ['Q10798782', 'diễn viên truyền hình'], ['Q177220', 'ca sĩ'], ['Q639669', 'nhạc sĩ'],
  ['Q36834', 'nhà soạn nhạc'], ['Q937857', 'cầu thủ bóng đá'], ['Q3665646', 'cầu thủ bóng rổ'], ['Q10833314', 'tay vợt'], ['Q2066131', 'vận động viên'],
  ['Q82955', 'chính trị gia'], ['Q372436', 'chính khách'], ['Q116', 'vua / nữ hoàng'], ['Q47064', 'quân nhân'], ['Q901', 'nhà khoa học'], ['Q169470', 'nhà vật lý'],
  ['Q170790', 'nhà toán học'], ['Q205375', 'nhà phát minh'], ['Q4964182', 'triết gia'], ['Q36180', 'nhà văn'], ['Q49757', 'nhà thơ'], ['Q1028181', 'họa sĩ'],
  ['Q2526255', 'đạo diễn phim'], ['Q43845', 'doanh nhân'], ['Q1930187', 'nhà báo']];
const KINDS = [['Q15632617', 'hư cấu (người)'], ['Q95074', 'hư cấu'], ['Q1114461', 'truyện tranh'], ['Q15711870', 'hoạt hình'],
  ['Q15773347', 'phim'], ['Q15773317', 'truyền hình'], ['Q3658341', 'văn học']];

const okLabel = (v) => v && !/^Q\d+$/.test(v) && !v.includes('|') && v.length < 60;
function addGender(t, r) {
  const g = r.g && r.g.value;
  if (g && g.endsWith('Q6581097')) t.add('male'); else if (g && g.endsWith('Q6581072')) t.add('female');
}
async function loadWikidata() {
  const people = new Map(), chars = new Map();
  const put = (map, r, init) => {
    const id = r.item.value, name = r.itemLabel && r.itemLabel.value;
    if (!okLabel(name)) return null;
    let e = map.get(id);
    if (!e) { e = { n: name, s: +r.s.value, t: new Set(init) }; map.set(id, e); }
    return e;
  };
  const run = async (q, fn) => {
    try { (await sparql(q)).forEach(fn); } catch (err) { console.log('Wikidata lỗi:', err.message); }
    await sleep(2500);
  };
  const LBL = 'SERVICE wikibase:label { bd:serviceParam wikibase:language "vi,en". }';
  for (const [qid, tag] of OCC) {
    status = 'Đang nạp: ' + tag + '…';
    await run(`SELECT ?item ?itemLabel ?s ?g ?b ?d ?cLabel WHERE {
      ?item wdt:P106 wd:${qid}; wikibase:sitelinks ?s. FILTER(?s>=60)
      OPTIONAL{?item wdt:P21 ?g} OPTIONAL{?item wdt:P569 ?b} OPTIONAL{?item wdt:P570 ?d} OPTIONAL{?item wdt:P27 ?c}
      ${LBL} } ORDER BY DESC(?s) LIMIT 250`, (r) => {
      const e = put(people, r, ['real']); if (!e) return;
      e.t.add('occ:' + tag); addGender(e.t, r);
      if (r.b) { const y = parseInt(r.b.value, 10); if (!isNaN(y)) { e.t.add(y < 1800 ? 'b:trước 1800' : 'b:' + Math.floor(y / 10) * 10); if (y >= 1800) e.t.add('bc:' + (Math.floor(y / 100) + 1)); } }
      if (r.d) e.t.add('dead');
      if (r.cLabel && okLabel(r.cLabel.value)) e.t.add('c:' + r.cLabel.value);
    });
  }
  status = 'Đang nạp: người Việt Nam…';
  await run(`SELECT ?item ?itemLabel ?s ?g ?b ?d ?oLabel WHERE {
    ?item wdt:P27 wd:Q881; wdt:P31 wd:Q5; wikibase:sitelinks ?s. FILTER(?s>=8)
    OPTIONAL{?item wdt:P21 ?g} OPTIONAL{?item wdt:P569 ?b} OPTIONAL{?item wdt:P570 ?d} OPTIONAL{?item wdt:P106 ?o}
    ${LBL} } ORDER BY DESC(?s) LIMIT 600`, (r) => {
    const e = put(people, r, ['real']); if (!e) return;
    e.t.add('c:Việt Nam'); addGender(e.t, r);
    if (r.b) { const y = parseInt(r.b.value, 10); if (!isNaN(y)) { e.t.add(y < 1800 ? 'b:trước 1800' : 'b:' + Math.floor(y / 10) * 10); if (y >= 1800) e.t.add('bc:' + (Math.floor(y / 100) + 1)); } }
    if (r.d) e.t.add('dead');
    if (r.oLabel && okLabel(r.oLabel.value)) e.t.add('occ:' + r.oLabel.value);
  });
  for (const [qid, kind] of KINDS) {
    status = 'Đang nạp nhân vật ' + kind + '…';
    await run(`SELECT ?item ?itemLabel ?s ?g ?uLabel ?wLabel WHERE {
      ?item wdt:P31 wd:${qid}; wikibase:sitelinks ?s. FILTER(?s>=20)
      OPTIONAL{?item wdt:P21 ?g} OPTIONAL{?item wdt:P1080 ?u} OPTIONAL{?item wdt:P1441 ?w}
      ${LBL} } ORDER BY DESC(?s) LIMIT 300`, (r) => {
      const e = put(chars, r, []); if (!e) return;
      e.t.add('k:' + kind); addGender(e.t, r);
      if (r.uLabel && okLabel(r.uLabel.value)) e.t.add('u:' + r.uLabel.value);
      if (r.wLabel && okLabel(r.wLabel.value)) e.t.add('w:' + r.wLabel.value);
    });
  }
  const out = [];
  const emit = (map, emojiFn) => map.forEach((e) => {
    if (e.s >= 150) e.t.add('fame');
    out.push([e.n, emojiFn(e), [...e.t].join('|'), e.s]);
  });
  emit(people, (e) => (e.t.has('male') ? '👨' : e.t.has('female') ? '👩' : '🧑'));
  emit(chars, () => '🎭');
  if (out.length > 300) {
    DATA = out; ready = true; status = 'Đã nạp xong từ Wikidata';
    fs.writeFile(CACHE, JSON.stringify({ t: Date.now(), d: out }), () => {});
  } else status = 'Không tải được Wikidata, dùng dữ liệu dự phòng';
  rebuild();
  console.log(status, '— tổng', out.length);
}

/* ============ API ============ */
app.get('/', (req, res) => res.type('html').send(HTML));
app.get('/health', (req, res) => res.send('ok'));
app.get('/api/data', (req, res) => {
  res.set({ 'Content-Type': 'application/json', 'Content-Encoding': 'gzip', 'Cache-Control': 'no-cache' }).send(BUF);
});
const hits = {};
app.post('/api/learn', (req, res) => {
  const ip = req.ip, now = Date.now();
  hits[ip] = (hits[ip] || []).filter((t) => t > now - 36e5);
  if (hits[ip].length >= 5) return res.status(429).json({ error: 'Bạn dạy nhiều quá, thử lại sau.' });
  const b = req.body || {};
  const name = String(b.name || '').replace(/[<>|]/g, '').trim().slice(0, 40);
  const tags = (Array.isArray(b.tags) ? b.tags : []).map((x) => String(x).replace(/\|/g, '').slice(0, 60)).filter(Boolean).slice(0, 60);
  if (!name || tags.length < 2) return res.status(400).json({ error: 'Thiếu thông tin.' });
  hits[ip].push(now);
  LEARN.push([name, '⭐', tags.join('|'), 60]);
  fs.writeFile(LFILE, JSON.stringify(LEARN), () => {});
  rebuild();
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Genie chạy tại cổng ' + PORT);
  if (!ready) loadWikidata().catch((e) => console.log('Lỗi nạp dữ liệu:', e.message));
});
