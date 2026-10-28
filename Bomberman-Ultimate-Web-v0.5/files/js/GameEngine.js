GameEngine = Class.extend({
    tileSize: 32,
    tilesX: 17,
    tilesY: 13,
    size: {},
    fps: 50,
    botsCount: 2, /* 0 - 3 */
    playersCount: 2, /* 1 - 2 */
    bonusesPercent: 16,
    ultimateMode: false,

    stage: null,
    menu: null,
    players: [],
    bots: [],
    tiles: [],
    bombs: [],
    bonuses: [],

    playerBoyImg: null,
    playerGirlImg: null,
    playerGirl2Img: null,
    botDarkImg: null,
    tilesImgs: {},
    bombImg: null,
    fireImg: null,
    bonusesImg: null,

    playing: false,
    mute: false,
    soundtrackLoaded: false,
    soundtrackPlaying: false,
    soundtrack: null,
    soundtrackRate: 1,
    lobbyOpen: false,

    init: function() {
        this.size = {
            w: this.tileSize * this.tilesX,
            h: this.tileSize * this.tilesY
        };
    },

    load: function() {
        // Init canvas
        this.stage = new createjs.Stage("canvas");
        this.stage.enableMouseOver();
        if (createjs.Touch && createjs.Touch.isSupported && createjs.Touch.isSupported()) {
            createjs.Touch.enable(this.stage, true, false);
        }

        // Load assets
        var queue = new createjs.LoadQueue();
        var that = this;
        queue.addEventListener("complete", function() {
            that.playerBoyImg = queue.getResult("playerBoy");
            that.playerGirlImg = queue.getResult("playerGirl");
            that.playerGirl2Img = queue.getResult("playerGirl2");
            that.botDarkImg = that.createDarkSkinBotImage(that.playerBoyImg);
            that.tilesImgs.grass = queue.getResult("tile_grass");
            that.tilesImgs.wall = queue.getResult("tile_wall");
            that.tilesImgs.wood = queue.getResult("tile_wood");
            that.bombImg = queue.getResult("bomb");
            that.fireImg = queue.getResult("fire");
            that.bonusesImg = queue.getResult("bonuses");
            that.setup();
        });
        queue.loadManifest([
            {id: "playerBoy", src: "./files/img/george.png"},
            {id: "playerGirl", src: "./files/img/betty.png"},
            {id: "playerGirl2", src: "./files/img/betty2.png"},
            {id: "tile_grass", src: "./files/img/tile_grass.png"},
            {id: "tile_wall", src: "./files/img/tile_wall.png"},
            {id: "tile_wood", src: "./files/img/tile_wood.png"},
            {id: "bomb", src: "./files/img/bomb.png"},
            {id: "fire", src: "./files/img/fire.png"},
            {id: "bonuses", src: "./files/img/bonuses.png"}
        ]);

        createjs.Sound.addEventListener("fileload", this.onSoundLoaded);
        createjs.Sound.alternateExtensions = ["mp3"];
        createjs.Sound.registerSound("./files/sound/bomb.ogg", "bomb");
        createjs.Sound.registerSound("./files/sound/game.ogg", "game");

        // Create menu
        this.menu = new Menu();
    },

    createDarkSkinBotImage: function(sourceImg) {
        // ULTIMATE MODE bot variant: recolor only the skin-toned pixels of the
        // original sprite sheet while leaving clothing/hair untouched.
        try {
            var c = document.createElement('canvas');
            c.width = sourceImg.width;
            c.height = sourceImg.height;
            var ctx = c.getContext('2d');
            ctx.drawImage(sourceImg, 0, 0);
            var imgData = ctx.getImageData(0, 0, c.width, c.height);
            var d = imgData.data;
            for (var i = 0; i < d.length; i += 4) {
                var r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
                if (!a) continue;
                // The George sheet uses a small warm skin palette. This range
                // deliberately avoids the gold/brown clothing colors.
                var skin = r >= 165 && g >= 100 && b >= 70 &&
                           r > g + 28 && g > b + 15;
                if (skin) {
                    d[i]     = Math.max(55, Math.round(r * 0.45));
                    d[i + 1] = Math.max(35, Math.round(g * 0.38));
                    d[i + 2] = Math.max(24, Math.round(b * 0.32));
                }
            }
            ctx.putImageData(imgData, 0, 0);
            return c;
        } catch (e) {
            return sourceImg;
        }
    },

    setup: function() {
        if (!gInputEngine.bindings.length) {
            gInputEngine.setup();
        }

        this.bombs = [];
        this.tiles = [];
        this.bonuses = [];

        // Draw tiles
        this.drawTiles();
        this.drawBonuses();

        this.spawnBots();
        this.spawnPlayers();

        // Toggle sound
        gInputEngine.addListener('mute', this.toggleSound);

        // Restart listener
        // Timeout because when you press enter in address bar too long, it would not show menu
        setTimeout(function() {
            gInputEngine.addListener('restart', function() {
                if (gGameEngine.playersCount == 0) {
                    gGameEngine.menu.setMode('single');
                } else {
                    gGameEngine.menu.hide();
                    gGameEngine.restart();
                }
            });
        }, 200);
        // Escape listener
        gInputEngine.addListener('escape', function() {
            if (!gGameEngine.menu.visible) {
                gGameEngine.menu.show();
            }
        });

        // Start loop
        if (!createjs.Ticker.hasEventListener('tick')) {
            createjs.Ticker.addEventListener('tick', gGameEngine.update);
            createjs.Ticker.setFPS(this.fps);
        }
        gGameEngine.mute = Boolean(Storage.getValue('muted'));
        if (gGameEngine.playersCount > 0) {
            if (this.soundtrackLoaded) {
                this.playSoundtrack();
            }
        }

        if (!this.playing) {
            this.menu.show();
        }
    },

    onSoundLoaded: function(sound) {
        if (sound.id == 'game') {
            gGameEngine.soundtrackLoaded = true;
            if (gGameEngine.playersCount > 0) {
                gGameEngine.playSoundtrack();
            }
        }
    },

    playSoundtrack: function() {
        if (!gGameEngine.soundtrackPlaying) {
            gGameEngine.soundtrack = createjs.Sound.play("game", "none", 0, 0, -1);
            gGameEngine.soundtrack.setVolume(1);
            gGameEngine.soundtrackPlaying = true;
            gGameEngine.soundtrack.paused = gGameEngine.mute;
        }
        gGameEngine.setMusicRate(gGameEngine.ultimateMode ? 1.5 : 1);
    },

    setMusicRate: function(rate) {
        rate = Number(rate) || 1;
        gGameEngine.soundtrackRate = rate;
        var s = gGameEngine.soundtrack;
        if (!s) return;
        try {
            // SoundJS 0.6.1 may use WebAudio or an HTMLAudio element.
            if (s._sourceNode && s._sourceNode.playbackRate) {
                if (typeof s._sourceNode.playbackRate.setValueAtTime === 'function') {
                    var now = (s._context && s._context.currentTime) || 0;
                    s._sourceNode.playbackRate.setValueAtTime(rate, now);
                } else {
                    s._sourceNode.playbackRate.value = rate;
                }
            }
            if (s._playbackResource && typeof s._playbackResource.playbackRate !== 'undefined') {
                s._playbackResource.playbackRate = rate;
            }
            if (s._audioNode && typeof s._audioNode.playbackRate !== 'undefined') {
                s._audioNode.playbackRate = rate;
            }
        } catch (e) {}
    },

    update: function() {
        if (gGameEngine.lobbyOpen) {
            gGameEngine.menu.update();
            gGameEngine.stage.update();
            return;
        }

        // Player
        for (var i = 0; i < gGameEngine.players.length; i++) {
            var player = gGameEngine.players[i];
            player.update();
        }

        // Bots
        for (var i = 0; i < gGameEngine.bots.length; i++) {
            var bot = gGameEngine.bots[i];
            bot.update();
        }

        // Bombs
        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            var bomb = gGameEngine.bombs[i];
            bomb.update();
        }

        // Menu
        gGameEngine.menu.update();

        // Stage
        gGameEngine.stage.update();
    },

    drawTiles: function() {
        for (var i = 0; i < this.tilesY; i++) {
            for (var j = 0; j < this.tilesX; j++) {
                if ((i == 0 || j == 0 || i == this.tilesY - 1 || j == this.tilesX - 1)
                    || (j % 2 == 0 && i % 2 == 0)) {
                    // Wall tiles
                    var tile = new Tile('wall', { x: j, y: i });
                    this.stage.addChild(tile.bmp);
                    this.tiles.push(tile);
                } else {
                    // Grass tiles
                    var tile = new Tile('grass', { x: j, y: i });
                    this.stage.addChild(tile.bmp);

                    // Wood tiles
                    if (!(i <= 2 && j <= 2)
                        && !(i >= this.tilesY - 3 && j >= this.tilesX - 3)
                        && !(i <= 2 && j >= this.tilesX - 3)
                        && !(i >= this.tilesY - 3 && j <= 2)) {

                        var wood = new Tile('wood', { x: j, y: i });
                        this.stage.addChild(wood.bmp);
                        this.tiles.push(wood);
                    }
                }
            }
        }
    },

    drawBonuses: function() {
        // Cache destructible wood tiles. Bonuses are placed underneath the wood
        // and become visible when the block is destroyed.
        var woods = [];
        for (var i = 0; i < this.tiles.length; i++) {
            var tile = this.tiles[i];
            if (tile.material == 'wood') {
                woods.push(tile);
            }
        }

        // ULTIMATE MODE: every single destructible block contains a power-up.
        // Cycle the three bonus types so the board gets a roughly even mix.
        if (this.ultimateMode) {
            woods.sort(function() {
                return 0.5 - Math.random();
            });
            for (var u = 0; u < woods.length; u++) {
                var ultimateTile = woods[u];
                var ultimateBonus = new Bonus(ultimateTile.position, u % 3);
                this.bonuses.push(ultimateBonus);
                this.moveToFront(ultimateTile.bmp);
            }
            return;
        }

        // Normal/custom mode: each wood block independently uses the selected
        // item-drop percentage. 16% is the recovered game's default, while
        // 100% guarantees a power-up under every destructible block.
        var dropRate = Number(this.bonusesPercent);
        if (!isFinite(dropRate)) dropRate = 16;
        dropRate = Math.max(16, Math.min(100, dropRate));

        woods.sort(function() {
            return 0.5 - Math.random();
        });

        var normalType = 0;
        for (var n = 0; n < woods.length; n++) {
            if (dropRate >= 100 || Math.random() * 100 < dropRate) {
                var normalTile = woods[n];
                var normalBonus = new Bonus(normalTile.position, normalType % 3);
                this.bonuses.push(normalBonus);
                this.moveToFront(normalTile.bmp);
                normalType++;
            }
        }
    },

    spawnBots: function() {
        this.bots = [];

        if (this.botsCount >= 1) {
            var bot2 = new Bot({ x: 1, y: this.tilesY - 2 });
            this.bots.push(bot2);
        }

        if (this.botsCount >= 2) {
            var bot3 = new Bot({ x: this.tilesX - 2, y: 1 });
            this.bots.push(bot3);
        }

        if (this.botsCount >= 3) {
            var bot = new Bot({ x: this.tilesX - 2, y: this.tilesY - 2 });
            this.bots.push(bot);
        }

        if (this.botsCount >= 4) {
            var bot = new Bot({ x: 1, y: 1 });
            this.bots.push(bot);
        }
    },

    spawnPlayers: function() {
        this.players = [];

        if (this.playersCount >= 1) {
            var player = new Player({ x: 1, y: 1 });
            this.players.push(player);
        }

        if (this.playersCount >= 2) {
            var controls = {
                'up': 'up2',
                'left': 'left2',
                'down': 'down2',
                'right': 'right2',
                'bomb': 'bomb2'
            };
            var player2 = new Player({ x: this.tilesX - 2, y: this.tilesY - 2 }, controls, 1);
            this.players.push(player2);
        }
    },

    /**
     * Checks whether two rectangles intersect.
     */
    intersectRect: function(a, b) {
        return (a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom);
    },

    /**
     * Returns tile at given position.
     */
    getTile: function(position) {
        for (var i = 0; i < this.tiles.length; i++) {
            var tile = this.tiles[i];
            if (tile.position.x == position.x && tile.position.y == position.y) {
                return tile;
            }
        }
    },

    /**
     * Returns tile material at given position.
     */
    getTileMaterial: function(position) {
        var tile = this.getTile(position);
        return (tile) ? tile.material : 'grass' ;
    },

    gameOver: function(status) {
        if (gGameEngine.menu.visible) { return; }
        try {SocialModuleInstance && SocialModuleInstance.showSocial();} catch(e) {}
        if (status == 'win') {
            var winText = "You won!";
            if (gGameEngine.playersCount > 1) {
                var winner = gGameEngine.getWinner();
                winText = winner == 0 ? "Player 1 won!" : "Player 2 won!";
            }
            this.menu.show([{text: winText, color: '#669900'}, {text: ' ;D', color: '#99CC00'}]);
        } else {
            this.menu.show([{text: 'Game Over', color: '#CC0000'}, {text: ' :(', color: '#FF4444'}]);
        }
    },

    getWinner: function() {
        for (var i = 0; i < gGameEngine.players.length; i++) {
            var player = gGameEngine.players[i];
            if (player.alive) {
                return i;
            }
        }
    },

    restart: function() {
        gInputEngine.removeAllListeners();
        gGameEngine.stage.removeAllChildren();
        gGameEngine.setup();
    },

    /**
     * Moves specified child to the front.
     */
    moveToFront: function(child) {
        var children = gGameEngine.stage.getNumChildren();
        gGameEngine.stage.setChildIndex(child, children - 1);
    },

    toggleSound: function() {
        if (gGameEngine.mute) {
            gGameEngine.mute = false;
        } else {
            gGameEngine.mute = true;
        }
        Storage.setValue('muted', gGameEngine.mute);
        if (gGameEngine.soundtrack) gGameEngine.soundtrack.paused = gGameEngine.mute;
    },

    countPlayersAlive: function() {
        var playersAlive = 0;
        for (var i = 0; i < gGameEngine.players.length; i++) {
            if (gGameEngine.players[i].alive) {
                playersAlive++;
            }
        }
        return playersAlive;
    },

    getPlayersAndBots: function() {
        var players = [];

        for (var i = 0; i < gGameEngine.players.length; i++) {
            players.push(gGameEngine.players[i]);
        }

        for (var i = 0; i < gGameEngine.bots.length; i++) {
            players.push(gGameEngine.bots[i]);
        }

        return players;
    }
});

gGameEngine = new GameEngine();