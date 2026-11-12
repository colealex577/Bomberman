Menu = Class.extend({
    visible: true,

    views: [],
    onlineCountView: null,
    onlineCountValue: null,
    onlineCountNextAt: 0,

    getSimulatedOnlineCount: function() {
        var now = Date.now();
        if (this.onlineCountValue == null || now >= this.onlineCountNextAt) {
            var hour = (new Date()).getHours();
            var overnight = hour < 7 || hour >= 23;
            var min = overnight ? 1 : 8;
            var max = overnight ? 3 : 26;
            this.onlineCountValue = min + Math.floor(Math.random() * (max - min + 1));
            this.onlineCountNextAt = now + 45000 + Math.floor(Math.random() * 75000);
        }
        return this.onlineCountValue;
    },

    init: function() {
        gGameEngine.botsCount = 4;
        gGameEngine.playersCount = 0;

        this.showLoader();
    },

    show: function(text) {
        this.visible = true;

        this.draw(text);
    },

    hide: function() {
        this.visible = false;

        for (var i = 0; i < this.views.length; i++) {
            gGameEngine.stage.removeChild(this.views[i]);
        }

        this.views = [];
        if(window.BomberUI210)BomberUI210.sync();
    },

    update: function() {
        if (this.visible) {
            if (this.onlineCountView) {
                this.onlineCountView.text = "online: " + this.getSimulatedOnlineCount();
            }
            for (var i = 0; i < this.views.length; i++) {
                gGameEngine.moveToFront(this.views[i]);
            }
        }
    },

    setHandCursor: function(btn) {
        btn.addEventListener('mouseover', function() {
            document.body.style.cursor = 'pointer';
        });
        btn.addEventListener('mouseout', function() {
            document.body.style.cursor = 'auto';
        });
    },

    setMode: function(mode) {
        this.hide();

        gGameEngine.simulatedOpponentMode = false;
        if (mode == 'single') {
            gGameEngine.botsCount = 3;
            gGameEngine.playersCount = 1;
        } else if (mode == 'simulated') {
            gGameEngine.simulatedOpponentMode = true;
            gGameEngine.botsCount = 2;
            gGameEngine.playersCount = 1;
        } else {
            gGameEngine.botsCount = 2;
            gGameEngine.playersCount = 2;
        }

        gGameEngine.playing = true;
        gGameEngine.restart();
    },

    draw: function(text) {
        // HTML owns the main menu; no canvas overlay or click rectangles.
        this.menuMessage = Array.isArray(text) ? text.map(function(x){return x.text||''}).join('').replace(/\s*[:;][D)(]\s*$/,'') : '';
        for(var i=0;i<this.views.length;i++)gGameEngine.stage.removeChild(this.views[i]);
        this.views=[];this.onlineCountView=null;
        if(window.BomberUI210)BomberUI210.sync();
    },

    showLoader: function() {
        if(window.BomberUI210)BomberUI210.sync();
    }
});
