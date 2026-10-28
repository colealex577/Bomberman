Bot = Player.extend({
    direction: 'up',
    dirX: 0,
    dirY: -1,
    previousPosition: {},
    targetPosition: {},
    targetBitmapPosition: {},
    wait: false,
    startTimerMax: 60,
    startTimer: 0,
    started: false,
    thinkCooldown: 0,

    init: function(position) {
        this._super(position);
        // Ultimate-only AI speed buff. Human players keep their original speed.
        this.velocity = gGameEngine.ultimateMode ? 4 : 2;
        this.targetPosition = {x: position.x, y: position.y};
        this.targetBitmapPosition = Utils.convertToBitmapPosition(position);
        this.startTimerMax = Math.random() * 40;
    },

    update: function() {
        if (!this.alive) {
            this.fade();
            return;
        }
        if (gGameEngine.menu.visible || gGameEngine.lobbyOpen) {
            this.animate('idle');
            return;
        }

        if (!this.started) {
            this.startTimer++;
            if (this.startTimer < this.startTimerMax) {
                this.animate('idle');
                return;
            }
            this.started = true;
        }

        this.handleBonusCollision();

        // Make strategic decisions only while centered on a tile.
        if (this.atTargetCenter()) {
            this.bmp.x = this.targetBitmapPosition.x;
            this.bmp.y = this.targetBitmapPosition.y;
            this.updatePosition();
            this.chooseNextAction();
        }

        if (!this.atTargetCenter()) {
            this.moveToTargetPosition();
        } else {
            this.animate('idle');
        }

        this.handleBonusCollision();
        if (this.detectFireCollision()) this.die();
    },

    atTargetCenter: function() {
        return this.targetBitmapPosition &&
            Math.abs(this.targetBitmapPosition.x - this.bmp.x) < 0.01 &&
            Math.abs(this.targetBitmapPosition.y - this.bmp.y) < 0.01;
    },

    chooseNextAction: function() {
        var escapePath = null;

        // Survival always wins: if an existing bomb threatens us, route out first.
        if (!this.isSafe(this.position)) {
            escapePath = this.findEscapePath(null, null);
            if (escapePath && escapePath.length > 1) {
                this.setNextTile(escapePath[1]);
                return;
            }
        }

        var opponent = this.getBestOpponent();

        // Attack when a target is in our blast line, or when bombing opens the route.
        if (this.shouldPlantStrategicBomb(opponent)) {
            var futureEscape = this.findEscapePath(this.position, this.bombStrength);
            if (futureEscape && futureEscape.length > 1 && this.plantBomb()) {
                this.setNextTile(futureEscape[1]);
                return;
            }
        }

        // Exposed power-ups are highly valuable, but don't path through danger for them.
        var bonusPath = this.getBestBonusPath();
        if (bonusPath && bonusPath.length > 1) {
            this.setNextTile(bonusPath[1]);
            return;
        }

        // Hunt the nearest living human or AI using shortest-path routing.
        var huntPath = opponent ? this.findPath(this.position, opponent.position, true) : null;
        if (huntPath && huntPath.length > 1) {
            this.setNextTile(huntPath[1]);
            return;
        }

        // If wood blocks progress, deliberately route to a bombable wall edge.
        var woodPath = this.findPathToUsefulWood(opponent ? opponent.position : null);
        if (woodPath && woodPath.length > 1) {
            this.setNextTile(woodPath[1]);
            return;
        }
        if (woodPath && woodPath.length === 1 && this.getNearWood()) {
            var woodEscape = this.findEscapePath(this.position, this.bombStrength);
            if (woodEscape && woodEscape.length > 1 && this.plantBomb()) {
                this.setNextTile(woodEscape[1]);
                return;
            }
        }

        // Last resort: choose the safest available neighboring tile instead of random wandering.
        var safe = this.getWalkableNeighbors(this.position, true);
        if (!safe.length) safe = this.getWalkableNeighbors(this.position, false);
        if (safe.length) {
            safe.sort(function(a, b) {
                return this.distanceToNearestThreat(b) - this.distanceToNearestThreat(a);
            }.bind(this));
            this.setNextTile(safe[0]);
        }
    },

    setNextTile: function(position) {
        if (!position) return;
        this.targetPosition = {x: position.x, y: position.y};
        this.targetBitmapPosition = Utils.convertToBitmapPosition(this.targetPosition);
        this.loadTargetPosition(this.targetPosition);
    },

    moveToTargetPosition: function() {
        this.animate(this.direction);
        var velocity = this.velocity;
        var distanceX = Math.abs(this.targetBitmapPosition.x - this.bmp.x);
        var distanceY = Math.abs(this.targetBitmapPosition.y - this.bmp.y);
        if (distanceX > 0 && distanceX < velocity) velocity = distanceX;
        else if (distanceY > 0 && distanceY < velocity) velocity = distanceY;

        var targetPixels = {
            x: this.bmp.x + this.dirX * velocity,
            y: this.bmp.y + this.dirY * velocity
        };
        if (!this.detectWallCollision(targetPixels) && !this.detectBombCollision(targetPixels)) {
            this.bmp.x = targetPixels.x;
            this.bmp.y = targetPixels.y;
        } else {
            // Replan instead of grinding against an obstacle that appeared after planning.
            this.targetBitmapPosition = {x: this.bmp.x, y: this.bmp.y};
        }
        this.updatePosition();
    },

    loadTargetPosition: function(position) {
        this.dirX = position.x - this.position.x;
        this.dirY = position.y - this.position.y;
        if (this.dirX > 0) { this.dirX = 1; this.dirY = 0; this.direction = 'right'; }
        else if (this.dirX < 0) { this.dirX = -1; this.dirY = 0; this.direction = 'left'; }
        else if (this.dirY > 0) { this.dirX = 0; this.dirY = 1; this.direction = 'down'; }
        else if (this.dirY < 0) { this.dirX = 0; this.dirY = -1; this.direction = 'up'; }
    },

    key: function(position) {
        return position.x + ',' + position.y;
    },

    inBounds: function(position) {
        return position.x >= 0 && position.y >= 0 &&
            position.x < gGameEngine.tilesX && position.y < gGameEngine.tilesY;
    },

    hasBomb: function(position) {
        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            var bomb = gGameEngine.bombs[i];
            if (!bomb.exploded && Utils.comparePositions(bomb.position, position)) return true;
        }
        return false;
    },

    getWalkableNeighbors: function(position, avoidDanger) {
        var dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
        var out = [];
        for (var i = 0; i < dirs.length; i++) {
            var p = {x: position.x + dirs[i].x, y: position.y + dirs[i].y};
            if (!this.inBounds(p)) continue;
            if (gGameEngine.getTileMaterial(p) !== 'grass') continue;
            if (this.hasBomb(p)) continue;
            if (avoidDanger && !this.isSafe(p)) continue;
            out.push(p);
        }
        return out;
    },

    findPath: function(start, goal, avoidDanger) {
        if (!start || !goal) return null;
        var startKey = this.key(start);
        var goalKey = this.key(goal);
        if (startKey === goalKey) return [{x:start.x,y:start.y}];

        var queue = [{x:start.x,y:start.y}];
        var visited = {};
        var parent = {};
        visited[startKey] = true;

        while (queue.length) {
            var cur = queue.shift();
            var neighbors = this.getWalkableNeighbors(cur, avoidDanger);
            for (var i = 0; i < neighbors.length; i++) {
                var n = neighbors[i];
                var nk = this.key(n);
                if (visited[nk]) continue;
                visited[nk] = true;
                parent[nk] = this.key(cur);
                if (nk === goalKey) return this.rebuildPath(parent, startKey, nk);
                queue.push(n);
            }
        }
        return null;
    },

    rebuildPath: function(parent, startKey, endKey) {
        var keys = [endKey];
        var cur = endKey;
        while (cur !== startKey && parent[cur]) {
            cur = parent[cur];
            keys.push(cur);
        }
        if (keys[keys.length - 1] !== startKey) return null;
        keys.reverse();
        return keys.map(function(k) {
            var parts = k.split(',');
            return {x: Number(parts[0]), y: Number(parts[1])};
        });
    },

    getBestOpponent: function() {
        var all = gGameEngine.getPlayersAndBots();
        var best = null;
        var bestScore = Infinity;
        for (var i = 0; i < all.length; i++) {
            var candidate = all[i];
            if (!candidate || candidate === this || !candidate.alive) continue;
            var path = this.findPath(this.position, candidate.position, true);
            var score = path ? path.length :
                Math.abs(candidate.position.x - this.position.x) + Math.abs(candidate.position.y - this.position.y) + 20;
            if (score < bestScore) { best = candidate; bestScore = score; }
        }
        return best;
    },

    getBestBonusPath: function() {
        var best = null;
        for (var i = 0; i < gGameEngine.bonuses.length; i++) {
            var bonus = gGameEngine.bonuses[i];
            // Hidden bonuses under wood do not count until the wood is destroyed.
            if (gGameEngine.getTileMaterial(bonus.position) !== 'grass') continue;
            if (!this.isSafe(bonus.position)) continue;
            var path = this.findPath(this.position, bonus.position, true);
            if (path && (!best || path.length < best.length)) best = path;
        }
        return best;
    },

    getNearWood: function() {
        var dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
        for (var i = 0; i < dirs.length; i++) {
            var p = {x:this.position.x + dirs[i].x, y:this.position.y + dirs[i].y};
            if (gGameEngine.getTileMaterial(p) === 'wood') return gGameEngine.getTile(p);
        }
        return null;
    },

    findPathToUsefulWood: function(targetPosition) {
        var queue = [{x:this.position.x,y:this.position.y}];
        var startKey = this.key(this.position);
        var visited = {}; visited[startKey] = true;
        var parent = {};
        var candidates = [];

        while (queue.length) {
            var cur = queue.shift();
            if (this.isSafe(cur) && this.hasAdjacentWood(cur)) candidates.push(cur);
            var neighbors = this.getWalkableNeighbors(cur, true);
            for (var i = 0; i < neighbors.length; i++) {
                var n = neighbors[i], nk = this.key(n);
                if (visited[nk]) continue;
                visited[nk] = true;
                parent[nk] = this.key(cur);
                queue.push(n);
            }
        }
        if (!candidates.length) return null;
        var self = this;
        candidates.sort(function(a,b) {
            var da = targetPosition ? Math.abs(a.x-targetPosition.x)+Math.abs(a.y-targetPosition.y) : 0;
            var db = targetPosition ? Math.abs(b.x-targetPosition.x)+Math.abs(b.y-targetPosition.y) : 0;
            var pa = self.rebuildPath(parent,startKey,self.key(a));
            var pb = self.rebuildPath(parent,startKey,self.key(b));
            return (da + (pa ? pa.length * 0.35 : 99)) - (db + (pb ? pb.length * 0.35 : 99));
        });
        return this.rebuildPath(parent, startKey, this.key(candidates[0]));
    },

    hasAdjacentWood: function(position) {
        var dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
        for (var i=0;i<dirs.length;i++) {
            if (gGameEngine.getTileMaterial({x:position.x+dirs[i].x,y:position.y+dirs[i].y}) === 'wood') return true;
        }
        return false;
    },

    activeBombCount: function() {
        var count = 0;
        for (var i = 0; i < this.bombs.length; i++) if (!this.bombs[i].exploded) count++;
        return count;
    },

    targetInBlastLine: function(target) {
        if (!target || !target.alive) return false;
        var dx = target.position.x - this.position.x;
        var dy = target.position.y - this.position.y;
        if (dx !== 0 && dy !== 0) return false;
        var distance = Math.abs(dx) + Math.abs(dy);
        if (!distance || distance > this.bombStrength) return false;
        var sx = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        var sy = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
        for (var i = 1; i < distance; i++) {
            var p = {x:this.position.x+sx*i, y:this.position.y+sy*i};
            if (gGameEngine.getTileMaterial(p) !== 'grass' || this.hasBomb(p)) return false;
        }
        return true;
    },

    shouldPlantStrategicBomb: function(opponent) {
        if (this.activeBombCount() >= this.bombsMax || this.hasBomb(this.position)) return false;
        if (!this.findEscapePath(this.position, this.bombStrength)) return false;
        if (this.targetInBlastLine(opponent)) return true;

        if (opponent) {
            var manhattan = Math.abs(opponent.position.x - this.position.x) + Math.abs(opponent.position.y - this.position.y);
            // With extra bomb capacity, pressure nearby opponents from multiple positions.
            if (this.bombsMax > 1 && manhattan <= Math.max(3, this.bombStrength + 1)) return true;
        }
        return !!this.getNearWood();
    },

    simulatedBlast: function(origin, strength) {
        var out = [{x:origin.x,y:origin.y}];
        var dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
        for (var d=0; d<dirs.length; d++) {
            for (var j=1; j<=strength; j++) {
                var p={x:origin.x+dirs[d].x*j,y:origin.y+dirs[d].y*j};
                var material=gGameEngine.getTileMaterial(p);
                if (material==='wall') break;
                out.push(p);
                if (material==='wood') break;
            }
        }
        return out;
    },

    buildDangerMap: function(extraOrigin, extraStrength) {
        var danger = {};
        for (var i=0;i<gGameEngine.bombs.length;i++) {
            var b=gGameEngine.bombs[i];
            if (b.exploded) continue;
            var positions=b.getDangerPositions();
            for (var j=0;j<positions.length;j++) danger[this.key(positions[j])] = true;
        }
        if (extraOrigin) {
            var extra=this.simulatedBlast(extraOrigin, extraStrength || this.bombStrength);
            for (var k=0;k<extra.length;k++) danger[this.key(extra[k])] = true;
        }
        return danger;
    },

    findEscapePath: function(extraOrigin, extraStrength) {
        var danger = this.buildDangerMap(extraOrigin, extraStrength);
        var start={x:this.position.x,y:this.position.y};
        var startKey=this.key(start);
        var queue=[start];
        var visited={}; visited[startKey]=true;
        var parent={};
        var depth={}; depth[startKey]=0;
        var extraKey=extraOrigin ? this.key(extraOrigin) : null;

        while(queue.length) {
            var cur=queue.shift();
            var ck=this.key(cur);
            if (ck!==startKey && !danger[ck]) return this.rebuildPath(parent,startKey,ck);
            if (depth[ck] >= 8) continue;
            var dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
            for(var i=0;i<dirs.length;i++) {
                var n={x:cur.x+dirs[i].x,y:cur.y+dirs[i].y};
                var nk=this.key(n);
                if(visited[nk] || !this.inBounds(n)) continue;
                if(gGameEngine.getTileMaterial(n)!=='grass') continue;
                // The just-planted bomb blocks re-entry, but the bot may leave its starting tile.
                if(this.hasBomb(n) || (extraKey && nk===extraKey)) continue;
                visited[nk]=true; parent[nk]=ck; depth[nk]=depth[ck]+1; queue.push(n);
            }
        }
        return null;
    },

    distanceToNearestThreat: function(position) {
        var best=99;
        var all=gGameEngine.getPlayersAndBots();
        for(var i=0;i<all.length;i++) {
            var p=all[i];
            if(!p || p===this || !p.alive) continue;
            best=Math.min(best,Math.abs(p.position.x-position.x)+Math.abs(p.position.y-position.y));
        }
        return best;
    },

    plantBomb: function() {
        if (this.hasBomb(this.position) || this.activeBombCount() >= this.bombsMax) return false;
        var bomb = new Bomb({x:this.position.x,y:this.position.y}, this.bombStrength);
        gGameEngine.stage.addChild(bomb.bmp);
        this.bombs.push(bomb);
        gGameEngine.bombs.push(bomb);
        var that = this;
        bomb.setExplodeListener(function() {
            Utils.removeFromArray(that.bombs, bomb);
        });
        return true;
    },

    isSafe: function(position) {
        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            var bomb = gGameEngine.bombs[i];
            if (bomb.exploded) continue;
            var fires = bomb.getDangerPositions();
            for (var j = 0; j < fires.length; j++) {
                if (Utils.comparePositions(fires[j], position)) return false;
            }
        }
        return true;
    },

    applyBonus: function(bonus) {
        // Smarter AI keeps every bomb-capacity upgrade it earns in every mode,
        // so it can actually use multiple bombs strategically.
        this._super(bonus);
    },

    die: function() {
        this._super();
        var botsAlive = false;
        var bots = gGameEngine.bots.slice();
        for (var i = 0; i < bots.length; i++) {
            var bot = bots[i];
            if (bot === this) Utils.removeFromArray(gGameEngine.bots, bot);
            else if (bot.alive) botsAlive = true;
        }
        if (!botsAlive && gGameEngine.countPlayersAlive() === 1) gGameEngine.gameOver('win');
    }
});
