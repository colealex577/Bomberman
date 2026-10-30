import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL,exe=process.env.CHROME_PATH;if(!base||!exe)throw Error('TEST_URL/CHROME_PATH missing');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await puppeteer.launch({executablePath:exe,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],timeout:30000});
const ctx=await browser.createBrowserContext(),p=await ctx.newPage(),errors=[];await p.setViewport({width:1280,height:800});
p.on('pageerror',e=>errors.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource.*404/i.test(m.text()))errors.push(m.text())});
await p.evaluateOnNewDocument(()=>{localStorage.setItem('BombermanPlayerName','V141Test');if(navigator.serviceWorker)navigator.serviceWorker.register=()=>Promise.resolve({})});
try{
 await p.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
 await p.waitForFunction(()=>window.BomberStability140?.version==='v0.14.1'&&window.gGameEngine?.menu,{timeout:30000});
 await p.evaluate(()=>{B115.setRole('offline');gGameEngine.menu.setMode('single')});
 await p.waitForFunction(()=>gGameEngine.bots&&gGameEngine.bots.length>=2&&!gGameEngine.menu.visible,{timeout:7000});await sleep(250);
 const r=await p.evaluate(()=>{const d=BomberStability140.debug,bot=gGameEngine.bots[0],human=gGameEngine.players[0];human.alive=true;bot.alive=true;bot.hyperAggressive=true;const humanTarget=bot.getBestOpponent()===human,bonusSuppressed=bot.getBestBonusPath()===null,cfg=d.chatConfig();d.setTrail(bot,['1,1','2,1']);bot.position={x:2,y:1};bot.targetPosition={x:1,y:1};const first=d.corridorDecision(bot);d.setTrail(bot,['1,1','2,1','1,1']);bot.position={x:1,y:1};bot.targetPosition={x:2,y:1};const second=d.corridorDecision(bot),state=d.state(bot);return{humanTarget,bonusSuppressed,cfg,first,second,state}});
 assert.equal(r.humanTarget,true,'open-board bot did not prioritize the human');
 assert.equal(r.bonusSuppressed,true,'open-board bot still diverted to powerups');
 assert.equal(r.first,'','first corridor reversal should be allowed');
 assert.equal(r.second,'horizontal','second same-axis corridor reversal was not blocked');
 assert.equal(r.state.exitAxis,'horizontal','corridor exit state was not armed');
 assert.ok(r.state.loopBlocks>=1,'corridor loop block was not counted');
 assert.ok(r.cfg.minGap>=4000,'chat cooldown is still too aggressive');
 assert.ok(r.cfg.powerHintChance<=.25&&r.cfg.spectatorPickupChance<=.12&&r.cfg.bragChance<=.35&&r.cfg.duelChatChance<=.5,'autonomous chat probabilities are too high');
 if(errors.length)throw Error('browser errors: '+errors.join(' | '));
 console.log('V141_AI_CHAT_SMOKE PASS',JSON.stringify(r));
}finally{await ctx.close().catch(()=>{});await browser.close().catch(()=>{})}
