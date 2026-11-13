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
source=re.sub(r'<script(?: defer)? src="([^"]+)"></script>',script,source)
def css(m):
 p=m.group(1).split('?')[0].removeprefix('./');s=(root/p).read_text();s=re.sub(r"url\(['\"]?\.\./([^)'\"]+)['\"]?\)",lambda v:"url('"+assets.get('files/'+v.group(1),v.group(1))+"')",s);return '<style>'+s+'</style>'
source=re.sub(r'<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>',css,source)
source=re.sub(r'(src="\./)([^"?]+)(")',lambda m:'src="'+assets[m.group(2)]+'"' if m.group(2) in assets else m.group(0),source)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 ctx=b.new_context(viewport={'width':1280,'height':900},service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def boot(page):
  page.set_content(source,wait_until='domcontentloaded',timeout=20000)
  page.wait_for_function("window.BomberEngine2Loader && BomberEngine2Loader.status().state==='ready' && window.gGameEngine && gGameEngine.playerBoyImg",timeout=20000)
  page.wait_for_timeout(600);assert page.title()=='Bomberman v2.1.2';assert page.evaluate('BomberEngine2Loader.status().loaded.length')==39
 boot(page)
 page.locator('#bm210Solo').click();page.wait_for_timeout(700)
 page.evaluate('BomberEngine2Render.configure({fps:"auto",scale:2})')
 def sample(page,ms):
  before=page.evaluate('({t:performance.now(),d:BomberEngine2Diagnostics.snapshot()})');page.wait_for_timeout(ms);after=page.evaluate('({t:performance.now(),d:BomberEngine2Diagnostics.snapshot()})');dt=(after['t']-before['t'])/1000;steps=after['d']['clock']['steps']-before['d']['clock']['steps'];return {'seconds':round(dt,2),'simHz':round(steps/dt,1),'p95':after['d']['p95FrameWorkMs'],'max':after['d']['maxFrameWorkMs'],'renderFPS':after['d']['render']['measuredRenderFPS'],'catchUp':after['d']['clock']['catchUpSteps'],'droppedMs':after['d']['clock']['droppedMs'],'renderWidth':after['d']['render']['width'],'rate':after['d']['render']['targetFPS']}
 print('SOLO',sample(page,3500),flush=True)
 page.evaluate("BomberObserver154.returnMainMenu();B115.kind='public';B115.setRole('host');B115.startSimulated()")
 page.wait_for_timeout(1000);assert page.evaluate('B115.role==="simulated" && BomberSocial210.read().people.length>0')
 for i in range(5):
  result=sample(page,4500);print('PUBLIC',i+1,result,flush=True);assert result['simHz']>=43, result
  page.evaluate('gGameEngine.restart()');page.wait_for_timeout(250);before=page.evaluate('BomberEngine2Round.snapshot().placed');page.keyboard.press('Space');page.wait_for_timeout(120);assert page.evaluate('BomberEngine2Round.snapshot().placed')>before;assert page.evaluate('gGameEngine.players.concat(gGameEngine.bots).every(a=>a.velocity===2)')
 assert not errors,errors
 # Real touch platform + mobile viewport. Verify the joystick commits on a 7px drag and chat is not covering the board.
 mctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2,user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',service_workers='block');m=mctx.new_page();merrors=[];m.on('pageerror',lambda e:merrors.append(str(e)))
 boot(m);assert m.evaluate('document.body.classList.contains("touch-ui")');m.locator('#bm210Solo').tap();m.wait_for_timeout(550)
 assert m.evaluate('BomberMobile212.selectDirection(-7,1,null)==="left"&&BomberMobile212.selectDirection(1,-7,null)==="up"&&BomberMobile212.selectDirection(1,1,"left")===null')
 def joystick(page):
  q=page.locator('#mobileJoystick').bounding_box();assert q;cx=q['x']+q['width']/2;cy=q['y']+q['height']/2
  page.evaluate("({cx,cy})=>{let e=document.getElementById('mobileJoystick');e.dispatchEvent(new PointerEvent('pointerdown',{pointerId:17,clientX:cx,clientY:cy,pointerType:'touch',bubbles:true}));e.dispatchEvent(new PointerEvent('pointermove',{pointerId:17,clientX:cx-7,clientY:cy,pointerType:'touch',bubbles:true}));}",{'cx':cx,'cy':cy});assert page.evaluate('gInputEngine.actions.left===true && !gInputEngine.actions.right');assert page.evaluate("parseFloat(document.getElementById('mobileJoystickKnob').style.transform.split('(')[1]) < -15")
  page.evaluate("document.getElementById('mobileJoystick').dispatchEvent(new PointerEvent('pointerup',{pointerId:17,bubbles:true}));");assert page.evaluate('!gInputEngine.actions.left')
 joystick(m);m.set_viewport_size({'width':844,'height':390});m.wait_for_timeout(550);joystick(m)
 geometry=m.evaluate("""(()=>{let b=document.getElementById('canvas').getBoundingClientRect(),j=document.getElementById('mobileJoystick').getBoundingClientRect(),r=document.querySelector('#mobileControls .mobile_action_cluster').getBoundingClientRect();return {board:[b.left,b.right,b.top,b.bottom],left:[j.left,j.right],right:[r.left,r.right],w:innerWidth,h:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth}})()""");print('LANDSCAPE',geometry,flush=True);assert geometry['left'][1]<=geometry['board'][0]+3 and geometry['right'][0]>=geometry['board'][1]-3 and not geometry['overflow'];m.screenshot(path='/tmp/bm212-landscape.png')
 m.evaluate("BomberObserver154.returnMainMenu();BomberHumanObserver152.startObserver()")
 m.wait_for_timeout(900);assert m.evaluate('document.body.classList.contains("bm212-observing")');
 def checkChat(page):
  page.wait_for_timeout(350);res=page.evaluate("""(()=>{let b=document.getElementById('canvas').getBoundingClientRect(),c=document.getElementById('v154MobileChat').getBoundingClientRect(),p=document.getElementById('chatPanel');return {board:[b.left,b.right,b.top,b.bottom],chat:[c.left,c.right,c.top,c.bottom],legacy:getComputedStyle(p).display,chatVisible:c.height>0,overlap:c.top<b.bottom-1&&c.bottom>b.top+1&&c.left<b.right-1&&c.right>b.left+1}})()""");print('OBSERVER',res,flush=True);assert res['legacy']=='none' and res['chatVisible'] and not res['overlap'];return res
 obs=checkChat(m);assert obs['board'][3]<=390; m.screenshot(path='/tmp/bm212-observer-landscape.png');m.set_viewport_size({'width':390,'height':844});checkChat(m);m.screenshot(path='/tmp/bm212-observer-portrait.png');m.locator('#v154MobileChatBtn').tap();m.wait_for_timeout(200);assert m.locator('#v154MobileChatOverlay').is_visible();assert m.evaluate("getComputedStyle(document.getElementById('v154MobileChatOverlay')).position==='relative'");assert not merrors,merrors
 print('BROWSER 2.1.2 PASS: public rounds, joystick, landscape, portrait spectator, inline chat',flush=True);b.close()
