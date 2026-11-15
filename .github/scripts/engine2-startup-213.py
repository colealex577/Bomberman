from playwright.sync_api import sync_playwright
from pathlib import Path
import base64,json,re,mimetypes,html
root=Path(__file__).resolve().parents[2]/'Bomberman-Ultimate-Universal-Web-v0.10'
# Run real page scripts in a browser document without navigation; dynamic local scripts
# and assets are served from an in-memory map. This does not test actual network transport.
files={str(p.relative_to(root)):p.read_text() for p in root.rglob('*.js')}
assets={str(p.relative_to(root)):'data:'+ (mimetypes.guess_type(p.name)[0] or 'application/octet-stream')+';base64,'+base64.b64encode(p.read_bytes()).decode() for p in root.rglob('*') if p.is_file() and p.suffix in ['.png','.svg','.mp3','.ogg']}
packed={str(p.relative_to(root)):p.read_text() for p in root.rglob('*.b64')}
shim='''(function(){const JS=__JS__,ASSETS=__ASSETS__,PACKED=__PACKED__;function norm(u){return String(u||'').replace(/^\.\//,'').split('?')[0]};const data=new Map([['BombermanPlayerName','TestPlayer']]);Object.defineProperty(window,'localStorage',{value:new Proxy({getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),clear:()=>data.clear()},{get:(o,k)=>k in o?o[k]:data.get(k),set:(o,k,v)=>(data.set(k,String(v)),true)})});window.__bmErrors=[];window.addEventListener('error',e=>window.__bmErrors.push(String(e.message)));const nativeAppend=Node.prototype.appendChild;Node.prototype.appendChild=function(n){if(n&&n.tagName==='SCRIPT'&&n.getAttribute('src')){let path=norm(n.getAttribute('src'));if(JS[path]){let src=n.getAttribute('src');n.removeAttribute('src');n.textContent=JS[path];let result=nativeAppend.call(this,n);setTimeout(()=>{n.dispatchEvent(new Event('load'))},0);return result}}return nativeAppend.call(this,n)};const nativeFetch=window.fetch;window.fetch=(u,...args)=>{let path=norm(typeof u==='string'?u:u.url);if(PACKED[path])return Promise.resolve(new Response(PACKED[path]));if(ASSETS[path])return nativeFetch(ASSETS[path]);return Promise.reject(new Error('test transport disabled'))};const desc=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{get:desc.get,set:function(u){desc.set.call(this,ASSETS[norm(u)]||u)}});const md=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'src');Object.defineProperty(HTMLMediaElement.prototype,'src',{get:md.get,set:function(u){md.set.call(this,ASSETS[norm(u)]||u)}});const sa=Element.prototype.setAttribute;Element.prototype.setAttribute=function(k,v){if(k==='src'&&['IMG','AUDIO'].includes(this.tagName))v=ASSETS[norm(v)]||v;return sa.call(this,k,v)};const xo=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u,...args){return xo.call(this,m,ASSETS[norm(u)]||u,...args)};})();'''.replace('__JS__',json.dumps(files)).replace('__ASSETS__',json.dumps(assets)).replace('__PACKED__',json.dumps(packed))
def safe_script(s):return re.sub(r'</script',r'<\\/script',s,flags=re.I)
# Avoid HTML script-close sequences inside JSON strings.
source=(root/'index.html').read_text();source=source.replace('<head>','<head><script>'+safe_script(shim)+'</script>',1)
def script(m):
 p=m.group(1).split('?')[0].removeprefix('./');return '<script>'+safe_script(files[p])+'</script>'
source=re.sub(r'<script src="([^"]+)"></script>',script,source)
def css(m):
 p=m.group(1).split('?')[0].removeprefix('./');s=(root/p).read_text();s=re.sub(r"url\(['\"]?\.\./([^)'\"]+)['\"]?\)",lambda v:"url('"+assets.get('files/'+v.group(1),v.group(1))+"')",s);return '<style>'+s+'</style>'
source=re.sub(r'<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>',css,source)
source=re.sub(r'(src="\./)([^"?]+)(")',lambda m:'src="'+assets[m.group(2)]+'"' if m.group(2) in assets else m.group(0),source)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for mode in ('delayed','missing'):
  ctx=b.new_context(viewport={'width':1280,'height':900},service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  # Delay the actual script execution, not just its load event. This emulates cold network ordering.
  injected=source.replace("let result=nativeAppend.call(this,n);setTimeout(()=>{n.dispatchEvent(new Event('load'))},0);return result","if(path==='files/net-v0115-core.js'||path==='files/runtime-v0160-bomb-kick.offline.js'){setTimeout(()=>{nativeAppend.call(this,n);n.dispatchEvent(new Event('load'))},path.includes('net-v0115')?1800:650);return n}if(path==='files/runtime-v0161-bomb-kick-polish.js'&&"+str(mode=='missing').lower()+"){setTimeout(()=>n.dispatchEvent(new Event('error')),0);return n}let result=nativeAppend.call(this,n);setTimeout(()=>{n.dispatchEvent(new Event('load'))},0);return result")
  assert injected!=source
  page.set_content(injected,wait_until='domcontentloaded',timeout=20000)
  page.wait_for_timeout(350);page.set_viewport_size({'width':1100,'height':800});assert page.evaluate("!window.B115 && document.getElementById('bm210Actions').hidden && BomberEngine2Loader.status().state!=='ready'")
  if mode=='missing':
   page.wait_for_function("BomberEngine2Loader.status().state==='error'",timeout=20000);assert page.evaluate("document.getElementById('bm210Actions').hidden && /bomb-kick-polish/.test(BomberEngine2Loader.status().failed.message)");print('FAIL-CLOSED PASS',page.evaluate('BomberEngine2Loader.status().failed'),flush=True)
  else:
   page.wait_for_function("BomberEngine2Loader.status().state==='ready'",timeout=20000);page.wait_for_timeout(300)
   assert page.evaluate("BomberEngine2Loader.missingEssentials().length===0 && document.querySelectorAll('#qolStatHud [data-qol-stat=kick]').length===4")
   page.locator('#bm210Solo').click();page.wait_for_timeout(350)
   for i in range(4):
    state=page.evaluate("""(()=>{let g=gGameEngine,b=document.getElementById('canvas').getBoundingClientRect(),hud=[...document.querySelectorAll('#qolStatHud .qol_stat_box:not([hidden])')].map(e=>{let r=e.getBoundingClientRect();return {kick:!!e.querySelector('[data-qol-stat=kick]'),outside:r.bottom<=b.top+1||r.top>=b.bottom-1}});return {kicks:g.bonuses.filter(x=>x.type==='kick').length,hud,rank:!!window.BomberLeaderboard127}})()""")
    print('DELAYED ROUND',i+1,state,flush=True);assert state['kicks']>0 and len(state['hud'])==4 and all(x['kick'] and x['outside'] for x in state['hud']) and state['rank']
    page.evaluate('gGameEngine.restart()');page.wait_for_timeout(250)
   assert not errors,errors
   print('DELAYED STARTUP PASS',flush=True)
  ctx.close()
 b.close()
