import {spawn} from 'node:child_process';

const url=process.env.TEST_URL;
const chromePath=process.env.CHROME_PATH||'/usr/bin/google-chrome';
if(!url)throw new Error('TEST_URL is required');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const timed=(p,ms,label)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error(label+' timed out')),ms))]);

const chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port=9222','--user-data-dir=/tmp/bomberman-cdp-profile','about:blank'],{stdio:['ignore','ignore','pipe']});
let chromeLog='';chrome.stderr.on('data',d=>{chromeLog+=d.toString();if(chromeLog.length>30000)chromeLog=chromeLog.slice(-30000)});
let ws;
try{
  let targets=null;
  for(let i=0;i<80;i++){
    try{const r=await fetch('http://127.0.0.1:9222/json');if(r.ok){targets=await r.json();if(targets?.length)break}}catch{}
    await sleep(100);
  }
  if(!targets?.length)throw new Error('CDP target unavailable');
  console.log('MILESTONE: cdp-ready');
  const target=targets.find(t=>t.type==='page')||targets[0];
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await timed(new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true})}),3000,'websocket open');
  console.log('MILESTONE: websocket-open');
  let id=0;const pending=new Map();let domContent=false,loadFired=false;const exceptions=[];
  ws.addEventListener('message',ev=>{
    const m=JSON.parse(ev.data);
    if(m.id&&pending.has(m.id)){const x=pending.get(m.id);pending.delete(m.id);m.error?x.reject(new Error(JSON.stringify(m.error))):x.resolve(m.result);return}
    if(m.method==='Page.domContentEventFired')domContent=true;
    if(m.method==='Page.loadEventFired')loadFired=true;
    if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails?.text||'exception');
  });
  const send=(method,params={})=>timed(new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))}),4000,method);
  await send('Page.enable');await send('Runtime.enable');
  console.log('MILESTONE: domains-enabled');
  await send('Page.navigate',{url});
  console.log('MILESTONE: navigate-returned');
  await sleep(8000);
  console.log('MILESTONE: inspect-start dom='+domContent+' load='+loadFired);
  const expression=`JSON.stringify({readyState:document.readyState,bootHidden:document.getElementById('bootLoading')?.hidden??null,bootText:document.getElementById('bootLoading')?.textContent??null,canvas:!!document.getElementById('canvas'),menu:!!(window.gGameEngine&&gGameEngine.menu),menuVisible:!!(window.gGameEngine&&gGameEngine.menu&&gGameEngine.menu.visible),menuViews:gGameEngine?.menu?.views?.length??null,bomberOnline:!!window.BomberOnline,b115:!!window.B115,character:!!window.BomberCharacter,version:(document.getElementById('buildVersion119')||document.getElementById('buildVersion120')||document.getElementById('buildVersion121')||document.getElementById('buildVersion122')||document.getElementById('buildVersion123')||document.getElementById('buildVersion124')||document.getElementById('buildVersion'))?.textContent||'',bodyText:(document.body?.innerText||'').slice(0,500)})`;
  const r=await send('Runtime.evaluate',{expression,returnByValue:true});
  console.log('MILESTONE: inspect-returned');
  console.log('DOMContentLoaded event:',domContent);
  console.log('Load event:',loadFired);
  console.log('STATE:',r.result?.value||r.result?.description||'');
  console.log('EXCEPTIONS:',JSON.stringify(exceptions));
}catch(e){
  console.log('SMOKE_ERROR:',e&&e.stack||String(e));
}finally{
  try{ws?.close()}catch{}
  try{chrome.kill('SIGKILL')}catch{}
  if(chromeLog)console.log('CHROME STDERR TAIL:',chromeLog.slice(-6000));
}
process.exit(0);
