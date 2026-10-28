import {spawn} from 'node:child_process';

const url = process.env.TEST_URL;
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
if (!url) throw new Error('TEST_URL is required');

const chrome = spawn(chromePath,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--remote-debugging-port=9222','--user-data-dir=/tmp/bomberman-cdp-profile','about:blank'
],{stdio:['ignore','ignore','pipe']});
let chromeLog='';
chrome.stderr.on('data',d=>{chromeLog+=d.toString(); if(chromeLog.length>200000) chromeLog=chromeLog.slice(-200000)});

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitJson(path,tries=80){
  for(let i=0;i<tries;i++){
    try{const r=await fetch('http://127.0.0.1:9222'+path,{method:path.startsWith('/json/new')?'PUT':'GET'});if(r.ok)return await r.json()}catch{}
    await sleep(100);
  }
  throw new Error('Chrome DevTools did not become ready');
}

let ws;
try{
  await waitJson('/json/version');
  const target=await waitJson('/json/new?'+encodeURIComponent(url));
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true})});
  let id=0; const pending=new Map(); let domContent=false,loadFired=false; const consoleLines=[]; const exceptions=[];
  ws.addEventListener('message',ev=>{
    const m=JSON.parse(ev.data);
    if(m.id&&pending.has(m.id)){const {resolve,reject}=pending.get(m.id);pending.delete(m.id);m.error?reject(new Error(JSON.stringify(m.error))):resolve(m.result);return}
    if(m.method==='Page.domContentEventFired')domContent=true;
    if(m.method==='Page.loadEventFired')loadFired=true;
    if(m.method==='Runtime.consoleAPICalled')consoleLines.push((m.params.args||[]).map(a=>a.value??a.description??'').join(' '));
    if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails?.text||'exception');
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))});
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate',{url});
  await sleep(10000);
  const expression=`JSON.stringify({
    readyState:document.readyState,
    title:document.title,
    bootExists:!!document.getElementById('bootLoading'),
    bootHidden:document.getElementById('bootLoading')?document.getElementById('bootLoading').hidden:null,
    bootText:document.getElementById('bootLoading')?document.getElementById('bootLoading').textContent:null,
    canvasExists:!!document.getElementById('canvas'),
    canvasWidth:document.getElementById('canvas')?document.getElementById('canvas').width:null,
    menuExists:!!(window.gGameEngine&&gGameEngine.menu),
    menuVisible:!!(window.gGameEngine&&gGameEngine.menu&&gGameEngine.menu.visible),
    menuViews:(window.gGameEngine&&gGameEngine.menu&&gGameEngine.menu.views)?gGameEngine.menu.views.length:null,
    playing:!!(window.gGameEngine&&gGameEngine.playing),
    bomberOnline:!!window.BomberOnline,
    b115:!!window.B115,
    character:!!window.BomberCharacter,
    version:(document.getElementById('buildVersion119')||document.getElementById('buildVersion120')||document.getElementById('buildVersion121')||document.getElementById('buildVersion122')||document.getElementById('buildVersion123')||document.getElementById('buildVersion124')||document.getElementById('buildVersion'))?.textContent||'',
    bodyText:(document.body?.innerText||'').slice(0,600)
  })`;
  const r=await send('Runtime.evaluate',{expression,returnByValue:true});
  console.log('DOMContentLoaded event:',domContent);
  console.log('Load event:',loadFired);
  console.log('STATE:',r.result?.value||r.result?.description||'');
  console.log('EXCEPTIONS:',JSON.stringify(exceptions));
  console.log('CONSOLE:',JSON.stringify(consoleLines.slice(-40)));
} finally {
  try{ws?.close()}catch{}
  try{chrome.kill('SIGKILL')}catch{}
  if(chromeLog) console.log('CHROME STDERR TAIL:',chromeLog.slice(-6000));
}
