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
 ctx=b.new_context(viewport={'width':1280,'height':900},service_workers='block')
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.set_content(source,wait_until='domcontentloaded',timeout=20000)
  page.wait_for_function("window.BomberEngine2Loader && BomberEngine2Loader.status().state==='ready' && window.gGameEngine && gGameEngine.playerBoyImg",timeout=20000)
  page.wait_for_timeout(1800)
  print('READY',page.evaluate("({title:document.title,home:!document.getElementById('bm210Home').hidden,loader:BomberEngine2Loader.status().state, loaded:BomberEngine2Loader.status().loaded.length, player:!!gGameEngine.playerBoyImg, social:typeof BomberSocial210})"),flush=True)
  page.screenshot(path='/tmp/bm210-desktop.png')
  for w,h in [(390,844),(768,1024)]:
   page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(400)
   print('VIEW',w,page.evaluate("({width:document.documentElement.scrollWidth, inner:innerWidth, home:document.getElementById('bm210Home').getBoundingClientRect().width, buttons:[...document.querySelectorAll('#bm210Actions button')].filter(x=>!x.hidden).map(x=>[x.id,x.disabled,Math.round(x.getBoundingClientRect().height)])})"),flush=True)
   if w==390:page.screenshot(path='/tmp/bm210-mobile.png',full_page=True)
  page.set_viewport_size({'width':1280,'height':900});page.locator('#bm210Settings').click(timeout=5000);page.wait_for_timeout(500);print('settings',page.locator('#v127SettingsPanel').is_visible(),flush=True);page.screenshot(path='/tmp/bm210-settings.png');page.locator('#v127SettingsPanel .v127_close').click();
  page.locator('#bm210Multi').click();page.wait_for_timeout(400);print('lobby',page.locator('#multiplayerLobby').is_visible(),flush=True);page.screenshot(path='/tmp/bm210-lobby.png');page.locator('#lobbyCloseBtn').click();page.wait_for_timeout(300);
  page.locator('#bm210TestRoom').click();page.wait_for_timeout(250);assert page.locator('#v1626TestRoom').is_visible();page.locator('.v1626_room_close').click();page.wait_for_timeout(250);page.locator('#v127SettingsPanel .v127_close').click();page.wait_for_timeout(250);
  page.locator('#bm210Solo').click();page.wait_for_timeout(1000); print('solo',page.evaluate("({playing:gGameEngine.playing,home:!document.getElementById('bm210Home').hidden,players:gGameEngine.players.length,bots:gGameEngine.bots.length,version:BomberBuildVersion})"),flush=True)
  page.keyboard.press('Space');page.wait_for_timeout(300);print('bomb',page.evaluate("({bombs:gGameEngine.bombs.length,diag:BomberEngine2Round.snapshot()})"),flush=True)
  # The actual game loop, input dispatch and actor construction; no WebRTC transport.
  for i in range(5):
   page.evaluate("gGameEngine.restart()")
   page.wait_for_timeout(300)
   before=page.evaluate("BomberEngine2Round.snapshot().placed")
   page.keyboard.press('Space');page.wait_for_timeout(100)
   print('RESTART',i+1,page.evaluate("({placed:BomberEngine2Round.snapshot().placed,actorSpeed:gGameEngine.players.concat(gGameEngine.bots).map(a=>a.velocity)})"),flush=True)
   assert page.evaluate("BomberEngine2Round.snapshot().placed")>before
  page.evaluate("BomberObserver154.returnMainMenu();B115.kind='public';B115.setRole('host');B115.startSimulated()")
  page.wait_for_timeout(1800)
  print('SIM',page.evaluate("({role:B115.role,started:B115.started,people:BomberSocial210.read()?.people.map(x=>({p:x.p,role:x.role})),phase:BomberSocial210.read()?.phase,playerCount:gGameEngine.players.length})"),flush=True)
  page.evaluate("B115.sendChat('@'+BomberSocial210.read().people[0].p.name+' how do i kick a bomb?')")
  page.wait_for_timeout(6500)
  print('CHAT',page.evaluate("[...document.querySelectorAll('#chatMessages .chat_line')].map(x=>({text:x.innerText,owner:x.dataset.social210||''}))"),flush=True)
  print('SOCIAL STATE',page.evaluate("BomberSocial210.debug.state()"),flush=True)
  assert page.evaluate("[...document.querySelectorAll('#chatMessages [data-social210]')].some(x=>/WASD/i.test(x.innerText))"), 'Targeted kick question did not receive a contextual response'
  page.screenshot(path='/tmp/bm210-match.png')

 except Exception as e: print('BROWSER ERROR',repr(e),flush=True);print('state',page.evaluate("({title:document.title,loader:window.BomberEngine2Loader&&BomberEngine2Loader.status(),g:!!window.gGameEngine,stage:!!(window.gGameEngine&&gGameEngine.stage),assets:!!(window.gGameEngine&&gGameEngine.playerBoyImg),errors:window.__bmErrors&&window.__bmErrors.slice(0,10)})"),flush=True);raise
 print('PAGE ERRORS',errors[:25],len(errors),flush=True);b.close()
