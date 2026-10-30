from pathlib import Path
import re

runtime=Path('Bomberman-Ultimate-Universal-Web-v0.10/files/runtime-v0140-stability-social.js')
s=runtime.read_text()
s=s.replace("var CHAT_MIN_GAP=4200,CHAT_VISIBLE_GAP=6000,POWER_HINT_CHANCE=.22,SPECTATOR_PICK_CHANCE=.10,BRAG_CHANCE=.32,DUEL_CHAT_CHANCE=.45;","var CHAT_MIN_GAP=4200,POWER_HINT_CHANCE=.22,SPECTATOR_PICK_CHANCE=.10,BRAG_CHANCE=.32,DUEL_CHAT_CHANCE=.45;")
s=s.replace("lastLineAt:0,lastVisibleRemoteAt:0,replyGraceUntil:0,bonusSeen:{}","lastLineAt:0,bonusSeen:{}")
start=s.index('function wrapChat(owner,keyName){')
end=s.index('\nfunction patchChatDedupe()', start)
wrap="""function wrapChat(owner,keyName){if(!owner||typeof owner[keyName]!=='function'||owner[keyName].__v140Dedupe)return;var old=owner[keyName];function wrapped(name,text,local){if(chatGuardDepth)return old.apply(this,arguments);var remote=isSimRemote(name,local),root=S.els&&S.els.chatMessages,before=root?Array.prototype.slice.call(root.children):[],r;chatGuardDepth++;try{r=old.apply(this,arguments)}finally{chatGuardDepth--}if(remote&&root){var after=Array.prototype.slice.call(root.children),added=after.filter(function(n){return before.indexOf(n)<0});for(var i=0;i<added.length;i++){var row=added[i],strong=row.querySelector&&row.querySelector('strong'),span=row.querySelector&&row.querySelector('span');if(!span||strong&&clean(strong.textContent)!==clean(S.remoteName))continue;var finalText=span.textContent||'',k=normLine(finalText);if(k&&social.used[k]){row.remove();continue}if(k)markUsed(finalText)}}else if(remote){var k=normLine(text);if(k&&social.used[k])return false;if(k)markUsed(text)}return r}wrapped.__v140Dedupe=true;wrapped.__v140Old=old;owner[keyName]=wrapped}"""
s=s[:start]+wrap+s[end:]
start=s.index('function patchChatAnswers(){')
end=s.index('\nfunction expandLegacyPools()', start)
answers="""function patchChatAnswers(){if(S.__v140Answers)return;S.__v140Answers=true;var old=S.sendChat;S.sendChat=function(t){var text=String(t||'').trim(),before=remoteCount(),hadQ=!!social.pendingQuestion,r=old.apply(S,arguments);if(text&&S.role==='simulated'&&(hadQ||/[?]/.test(text))){social.pendingQuestion=null;setTimeout(function(){if(S.role==='simulated'&&remoteCount()<=before){var ans=answerFor(text);if(ans)say([ans],'answer-fallback',550)}},4700)}return r}}"""
s=s[:start]+answers+s[end:]
s=s.replace("minGap:CHAT_MIN_GAP,visibleGap:CHAT_VISIBLE_GAP,powerHintChance", "minGap:CHAT_MIN_GAP,powerHintChance")
if 'CHAT_VISIBLE_GAP' in s or 'lastVisibleRemoteAt' in s or 'replyGraceUntil' in s:
    raise SystemExit('global visible throttle remnants remain')
runtime.write_text(s)

test=Path('.github/scripts/v141-ai-chat-smoke.mjs')
t=test.read_text().replace("r.cfg.minGap>=4000&&r.cfg.visibleGap>=5500", "r.cfg.minGap>=4000")
test.write_text(t)
