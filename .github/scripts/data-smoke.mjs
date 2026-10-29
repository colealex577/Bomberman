import {spawn} from 'node:child_process';

const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const url = process.env.TEST_URL;
if (!url) throw new Error('TEST_URL missing');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const chrome = spawn(chromePath, [
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--remote-debugging-port=9222','--user-data-dir=/tmp/bm-data-smoke','about:blank'
], {stdio:['ignore','ignore','pipe']});
let stderr='';
chrome.stderr.on('data', d => { stderr += d.toString(); if(stderr.length>20000) stderr=stderr.slice(-20000); });

async function getJson(path, method='GET', tries=100) {
  for (let i=0;i<tries;i++) {
    try {
      const r=await fetch('http://127.0.0.1:9222'+path,{method});
      if(r.ok) return await r.json();
    } catch {}
    await sleep(100);
  }
  throw new Error('CDP not ready: '+path);
}
let ws;
let id=0;
const pending=new Map();
function send(method, params={}, timeout=5000) {
  return new Promise((resolve,reject)=>{
    const n=++id;
    const timer=setTimeout(()=>{pending.delete(n);reject(new Error(method+' timed out'));},timeout);
    pending.set(n,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});
    ws.send(JSON.stringify({id:n,method,params}));
  });
}
try {
  await getJson('/json/version');
  const target=await getJson('/json/new?'+encodeURIComponent(url),'PUT');
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true})});
  const exceptions=[];
  ws.addEventListener('message',ev=>{
    const m=JSON.parse(ev.data);
    if(m.id&&pending.has(m.id)){
      const p=pending.get(m.id);pending.delete(m.id);
      m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);
    } else if(m.method==='Runtime.exceptionThrown') {
      exceptions.push(m.params?.exceptionDetails?.text||'exception');
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate',{url});
  await sleep(9000);
  const expr=`JSON.stringify({
    readyState:document.readyState,
    canvas:!!document.getElementById('canvas'),
    gameEngine:!!window.gGameEngine,
    menu:!!(window.gGameEngine&&gGameEngine.menu),
    menuVisible:!!(window.gGameEngine&&gGameEngine.menu&&gGameEngine.menu.visible),
    b115:!!window.B115,
    bomberOnline:!!window.BomberOnline,
    dataLayer:!!window.BomberDataSync,
    dataInstalled:!!(window.B115&&B115.__dataSyncInstalled),
    lobby:!!document.getElementById('multiplayerLobby'),
    bodyText:(document.body?.innerText||'').slice(0,400)
  })`;
  const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true},5000);
  const state=JSON.parse(r.result.value);
  console.log('STATE',JSON.stringify(state));
  console.log('EXCEPTIONS',JSON.stringify(exceptions));
  if(!state.canvas||!state.gameEngine||!state.menu||!state.menuVisible||!state.b115||!state.bomberOnline||!state.dataLayer||!state.dataInstalled){
    throw new Error('Bomberman/data-sync boot incomplete');
  }
  if(exceptions.length) throw new Error('Runtime exceptions: '+exceptions.join(' | '));
} finally {
  try{ws?.close()}catch{}
  try{chrome.kill('SIGKILL')}catch{}
  if(stderr) console.log('CHROME_STDERR_TAIL',stderr.slice(-4000));
}
process.exit(0);
