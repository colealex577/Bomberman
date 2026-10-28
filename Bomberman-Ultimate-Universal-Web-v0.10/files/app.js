const LOCAL_MESSAGES = {
    Player1: "Player 1",
    Player2: "Player 2",
    move: "move",
    bomb: "plant the bomb",
    mute: "mute / unmute sound",
    restart: "restart",
    menu: "menu"
};
let getLocalsMessage = (messagename) => LOCAL_MESSAGES[messagename] || messagename;

function GUILocalization(){
    document.querySelector("#player1").textContent = getLocalsMessage("Player1");
    document.querySelector("#player2").textContent = getLocalsMessage("Player2");
    document.querySelector("#movement1").textContent = getLocalsMessage("move");
    document.querySelector("#bomb1").textContent = getLocalsMessage("bomb");
    document.querySelector("#movement2").textContent = getLocalsMessage("move");
    document.querySelector("#bomb2").textContent = getLocalsMessage("bomb");
    document.querySelector("#mute").textContent = getLocalsMessage("mute");
    document.querySelector("#restart").textContent = getLocalsMessage("restart");
    document.querySelector("#menu").textContent = getLocalsMessage("menu");
}

let Storage = {
    setValue : (key, value) => { localStorage[key] = JSON.stringify(value); },
    getValue : (key) => {
        let result = undefined;
        try {
            if (localStorage[key]) result = JSON.parse(localStorage[key]);
        } catch (e) {
            throw new StorageError(`Error in localStorage[${key}] value. ${localStorage[key]}`);
        }
        return result; 
    }
};

class StorageError extends Error {
    constructor(_msg){
        super();
        this.name = 'StorageError';
        this.message = _msg || 'Storage Error';
        this.stack = (new Error()).stack;
    }
}

function ensureBuildVersion(){
    let badge = document.getElementById('buildVersion');
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'buildVersion';
        badge.className = 'build_version';
        document.body.appendChild(badge);
    }
    badge.textContent = 'v0.11.7';
}

function loadV0117Compatibility(){
    if (document.getElementById('runtime-v0117-fix-loader')) return;
    const s = document.createElement('script');
    s.id = 'runtime-v0117-fix-loader';
    s.src = './files/runtime-v0116-fix.js?v=0117';
    document.head.appendChild(s);
}

document.addEventListener('DOMContentLoaded', () => {
    ensureBuildVersion();
    loadV0117Compatibility();
	GUILocalization();
	gGameEngine.load();
});
setInterval(ensureBuildVersion, 1200);
window.addEventListener('pageshow', ensureBuildVersion, {passive:true});
