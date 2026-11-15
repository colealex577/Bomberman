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
 ctx=b.new_context(viewport={'width':1280,'height':900},service_workers='block');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(source,wait_until='domcontentloaded',timeout=20000);page.wait_for_function("window.BomberEngine2Loader && BomberEngine2Loader.status().state==='ready'",timeout=25000);page.wait_for_timeout(500)
 assert page.title()=='Bomberman v2.2.0'
 page.locator('#bm210Solo').click();page.wait_for_timeout(300)
 result=page.evaluate(r"""(()=>{let g=gGameEngine,A=BomberFix16212,out={rounds:[],maps:[],guest:false};function check(x,m){if(!x)throw Error(m)}
 function verify(rate,label){let kicks=g.bonuses.filter(b=>b.type==='kick'),q=[0,0,0,0],wood=new Set(g.tiles.filter(t=>t.material==='wood').map(t=>t.position.x+','+t.position.y)),all=new Set(g.bonuses.map(b=>b.position.x+','+b.position.y));for(let k of kicks)q[A.quadrant(k.position,g)]++;let target=A.targetKickCount(rate);check(kicks.length===target,label+' count '+JSON.stringify({target,q,allocation:g.__v216KickAllocation}));check(Math.max(...q)-Math.min(...q)<=1,label+' uneven '+q);check(kicks.every(k=>wood.has(k.position.x+','+k.position.y)),label+' exposed drop');check(all.size===g.bonuses.length,label+' duplicate drops');check(g.bombKickMaxDrops===12,label+' cap');return{label,rate,count:kicks.length,quadrants:q,total:g.bonuses.length}}
 for(let rate of [16,25,50,75,100])for(let j=0;j<5;j++){g.ultimateMode=false;B115.applyDrop(rate,true);g.restart();out.rounds.push(verify(rate,'restart '+j))}
 g.ultimateMode=true;g.restart();out.ultimate=verify(100,'ultimate');g.ultimateMode=false;
 for(let map of BomberMaps133.maps){let oldTiles=g.tiles,oldBonuses=g.bonuses;try{g.tiles=[];for(let y=0;y<g.tilesY;y++)for(let x=0;x<g.tilesX;x++)if(BomberMaps133.material(map.id,x,y)==='wood')g.tiles.push(new Tile('wood',{x,y}));for(let rate of [16,100]){g.bonuses=[];g.bonusesPercent=rate;g.drawBonuses();out.maps.push(verify(rate,map.id));g.bonuses.forEach(b=>g.stage.removeChild(b.bmp));}g.tiles.forEach(t=>g.stage.removeChild(t.bmp))}finally{g.tiles=oldTiles;g.bonuses=oldBonuses}}
 g.bonusesPercent=16;let oldRandom=Math.random;g.bonuses.forEach(b=>g.stage.removeChild(b.bmp));g.bonuses=[];try{Math.random=()=>.99999;g.drawBonuses();out.emptySample=verify(16,'empty sample')}finally{Math.random=oldRandom}
 let consumed=g.bonuses[0];g.stage.removeChild(consumed.bmp);g.bonuses.splice(0,1);let before=g.bonuses.length;BomberKick161.ensureKickDistribution(g,true);check(g.bonuses.length===before,'render pass reallocated consumed drop');out.noRefill=true;
 let role=B115.role,active=BomberDataSync.active,oldRole=BomberDataSync.role;try{B115.role='guest';BomberDataSync.active=true;BomberDataSync.role='guest';let arr=g.bonuses.slice();g.drawBonuses();BomberKick161.ensureKickDistribution(g,true);check(g.bonuses.length===arr.length&&g.bonuses.every((x,i)=>x===arr[i]),'guest mutated drops');out.guest=true}finally{B115.role=role;BomberDataSync.active=active;BomberDataSync.role=oldRole}
 return out})()""")
 print('DROP CHECKS',json.dumps(result),flush=True)
 page.evaluate("BomberObserver154.returnMainMenu();B115.kind='public';B115.setRole('host');B115.startSimulated()")
 page.wait_for_timeout(650)
 hud=page.evaluate(r"""(()=>{let g=gGameEngine,L=BomberLeaderboard127,bot=g.simulatedOpponent||g.bots.find(b=>b.simulatedHuman),name=bot.displayName;for(let i=0;i<11&&L.profile(name).score<1000;i++)L.recordResult(name,100);if(L.profile(name).score!==1000)throw Error('rating setup');BomberV127.setScore(1000);BomberIdentity16232.sync();BomberIdentity16232.hud();let slot=bot.statSlot,box=document.querySelector('.qol_stat_box[data-slot="'+slot+'"]'),pts=box.querySelector('.v125_points');window.__216HudHistory=[];window.__216HudObserver=new MutationObserver(records=>{records.forEach(r=>{window.__216HudHistory.push({text:pts.textContent,old:r.oldValue})})});__216HudObserver.observe(pts,{childList:true,subtree:true,characterData:true,characterDataOldValue:true});return {name,text:pts.textContent,rank:L.profile(name).displayRank,slot,local:document.querySelector('.qol_stat_box[data-slot="0"] .v125_points').textContent}})()""")
 assert hud['text']==f"1000 MAX · #{hud['rank']}",hud
 assert hud['local'].startswith('1000 MAX · #'),hud
 page.wait_for_timeout(1700)
 after=page.evaluate(r"""(()=>{let box=document.querySelector('.qol_stat_box[data-slot="'+(gGameEngine.simulatedOpponent||gGameEngine.bots.find(b=>b.simulatedHuman)).statSlot+'"]');return {text:box.querySelector('.v125_points').textContent,changes:window.__216HudHistory}})()""")
 assert after['text']==hud['text'] and not after['changes'],after
 print('STABLE MAX HUD',hud,after,flush=True)
 page.evaluate("BomberV127.setScore(990);BomberIdentity16232.hud()")
 assert page.evaluate('document.querySelector(\'.qol_stat_box[data-slot="0"] .v125_points\').textContent.startsWith("990 · #")')
 assert not errors,errors
 print('216 PASS',flush=True);b.close()
