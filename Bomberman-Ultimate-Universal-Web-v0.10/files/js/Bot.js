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
    escapeMode: false,
    escapePath: null,
    escapePathIndex: 0,
    escapeThreatBomb: null,
    escapeDestination: null,
    isBot: true,
    hyperAggressive: false,
    hyperAggroSpeedApplied: false,

    init: function(position) {
        this._super(position);
        // Ultimate-only AI speed buff. Human players keep their original speed.
        this.velocity = gGameEngine.ultimateMode ? 4 : 2;
        this.targetPosition = {x: position.x, y: position.y};
        this.targetBitmapPosition = Utils.convertToBitmapPosition(position);
        this.startTimerMax = Math.random() * 40;
        this.escapeMode = false;
        this.escapePath = null;
        this.escapePathIndex = 0;
        this.escapeThreatBomb = null;
        this.escapeDestination = null;
        this.hyperAggressive = false;
        this.hyperAggroSpeedApplied = false;
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
        this.updateEndgameAggression();

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
        // Once a bot plants a bomb it commits to an escape route instead of
        // re-thinking every tile and oscillating back into the blast.
        if (this.escapeMode) {
            if (this.continueEscapePlan()) return;
        }

        var escapePath = null;

        // Survival always wins: if an existing bomb threatens us, lock onto a
        // safe route and stay in cover until the threat has cleared.
        if (!this.isSafe(this.position)) {
            escapePath = this.findEscapePath(null, null);
            if (escapePath && escapePath.length > 1) {
                this.beginEscapePlan(escapePath, this.getMostImmediateThreatBomb());
                this.setNextTile(escapePath[1]);
                return;
            }
        }

        var opponent = this.getBestOpponent();

        // Once the board is almost completely open, surviving bots switch into
        // a much more aggressive chase-and-bomb style while preserving the same
        // blast/fuse safety checks used by their normal escape planner.
        if (this.hyperAggressive && this.chooseHyperAggressiveAction(opponent)) return;

        // Attack when a target is in our blast line, or when bombing opens the route.
        if (this.shouldPlantStrategicBomb(opponent)) {
            var spareAfterPlant = this.bombsMax - (this.activeBombCount() + 1);
            var futureEscape = this.findEscapePath(this.position, this.bombStrength, spareAfterPlant > 0);
            if (futureEscape && futureEscape.length > 1) {
                var planted = this.plantBomb();
                if (planted) {
                    this.beginEscapePlan(futureEscape, planted);
                    this.setNextTile(futureEscape[1]);
                    return;
                }
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
            var spareAfterWoodBomb = this.bombsMax - (this.activeBombCount() + 1);
            var woodEscape = this.findEscapePath(this.position, this.bombStrength, spareAfterWoodBomb > 0);
            if (woodEscape && woodEscape.length > 1) {
                var woodBomb = this.plantBomb();
                if (woodBomb) {
                    this.beginEscapePlan(woodEscape, woodBomb);
                    this.setNextTile(woodEscape[1]);
                    return;
                }
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

    remainingWoodCount: function() {
        var count = 0;
        for (var i = 0; i < gGameEngine.tiles.length; i++) {
            if (gGameEngine.tiles[i].material === 'wood') count++;
        }
        return count;
    },

    updateEndgameAggression: function() {
        // 118 destructible blocks exist at round start. Ten or fewer means the
        // board is essentially open and it is time to stop farming blocks.
        var shouldAggro = this.remainingWoodCount() <= 10;
        if (shouldAggro && !this.hyperAggressive) {
            this.hyperAggressive = true;
            if (!this.hyperAggroSpeedApplied) {
                this.velocity = Math.max(this.velocity * 1.6, gGameEngine.ultimateMode ? 6.0 : 3.2);
                this.hyperAggroSpeedApplied = true;
            }
        }
    },

    blastWouldHit: function(origin, targetPosition) {
        if (!origin || !targetPosition) return false;
        var blast = this.simulatedBlast(origin, this.bombStrength);
        for (var i = 0; i < blast.length; i++) {
            if (Utils.comparePositions(blast[i], targetPosition)) return true;
        }
        return false;
    },

    findAggressiveLanePath: function(opponent) {
        if (!opponent || !opponent.alive) return null;
        var best = null;
        var bestScore = Infinity;

        // Search every open lane for a tile whose blast can reach the opponent.
        // On the late open board this naturally produces row/column ambushes.
        for (var y = 1; y < gGameEngine.tilesY - 1; y++) {
            for (var x = 1; x < gGameEngine.tilesX - 1; x++) {
                var p = {x:x, y:y};
                if (gGameEngine.getTileMaterial(p) !== 'grass' || this.hasBomb(p) || !this.isSafe(p)) continue;
                if (!this.blastWouldHit(p, opponent.position)) continue;
                var path = this.findPath(this.position, p, true);
                if (!path) continue;
                var dist = Math.abs(p.x - opponent.position.x) + Math.abs(p.y - opponent.position.y);
                var score = path.length + dist * 0.15;
                if (score < bestScore) { best = path; bestScore = score; }
            }
        }
        return best;
    },

    chooseHyperAggressiveAction: function(opponent) {
        if (!opponent || !opponent.alive) return false;

        var active = this.activeBombCount();
        var spare = this.bombsMax - active;
        var distance = Math.abs(opponent.position.x - this.position.x) + Math.abs(opponent.position.y - this.position.y);

        // Fire immediately when aligned, or use spare bomb capacity to create
        // rolling pressure in nearby rows. Every placement still requires a
        // timed escape path through the combined danger map of all live bombs.
        if (spare > 0 && !this.hasBomb(this.position) && this.isSafe(this.position)) {
            var score = this.scoreBombPlacement(this.position);
            var shouldPressure = this.blastWouldHit(this.position, opponent.position) ||
                score >= 8 || (this.bombsMax > 1 && distance <= 7 && score >= 3);
            if (shouldPressure) {
                var escape = this.findEscapePath(this.position, this.bombStrength, spare > 1);
                if (escape && escape.length > 1) {
                    var bomb = this.plantBomb();
                    if (bomb) {
                        this.beginEscapePlan(escape, bomb);
                        this.setNextTile(escape[1]);
                        return true;
                    }
                }
            }
        }

        // Sprint to a firing lane rather than merely following directly behind.
        var lanePath = this.findAggressiveLanePath(opponent);
        if (lanePath && lanePath.length > 1) {
            this.setNextTile(lanePath[1]);
            return true;
        }

        // If no immediate lane exists, relentlessly follow the nearest survivor
        // through safe tiles. This includes humans and other AI.
        var chase = this.findPath(this.position, opponent.position, true);
        if (chase && chase.length > 1) {
            this.setNextTile(chase[1]);
            return true;
        }

        return false;
    },

    beginEscapePlan: function(path, bomb) {
        if (!path || path.length < 2) return false;
        this.escapeMode = true;
        this.escapePath = path.map(function(p) { return {x:p.x, y:p.y}; });
        this.escapePathIndex = 1;
        this.escapeThreatBomb = bomb || null;
        this.escapeDestination = this.escapePath[this.escapePath.length - 1];
        return true;
    },

    clearEscapePlan: function() {
        this.escapeMode = false;
        this.escapePath = null;
        this.escapePathIndex = 0;
        this.escapeThreatBomb = null;
        this.escapeDestination = null;
    },

    trackedBombStillDangerous: function() {
        if (!this.escapeThreatBomb) return false;
        // A bomb remains a threat while it is ticking or while its fire animation
        // still exists in the engine's bomb list.
        return gGameEngine.bombs.indexOf(this.escapeThreatBomb) !== -1;
    },

    continueEscapePlan: function() {
        // IMPORTANT: while moving along a valid escape route, do not re-plan merely
        // because the bot is still standing inside the bomb's projected blast line.
        // Those tiles are expected during an escape. Re-planning here caused the
        // old left-right oscillation and sent bots back toward their own bombs.
        if (this.escapePath && this.escapePathIndex < this.escapePath.length) {
            var next = this.escapePath[this.escapePathIndex];

            // Advance the committed path when we reach its current waypoint.
            if (Utils.comparePositions(this.position, next)) {
                this.escapePathIndex++;
                if (this.escapePathIndex < this.escapePath.length) {
                    next = this.escapePath[this.escapePathIndex];
                }
            }

            if (this.escapePathIndex < this.escapePath.length) {
                // A newly placed bomb can block a planned corridor. Re-plan only
                // when the route actually becomes impossible.
                if (gGameEngine.getTileMaterial(next) !== 'grass' || this.hasBomb(next)) {
                    var reroute = this.findEscapePath(null, null);
                    if (reroute && reroute.length > 1) {
                        this.escapePath = reroute;
                        this.escapePathIndex = 1;
                        this.escapeDestination = reroute[reroute.length - 1];
                        next = reroute[1];
                    } else {
                        this.animate('idle');
                        return true;
                    }
                }
                this.setNextTile(next);
                return true;
            }
        }

        // We reached cover. Stay put until the bomb/fire we escaped has cleared.
        // This prevents the old behavior where a bot immediately wandered back
        // into its own blast after reaching a safe corner.
        if (this.trackedBombStillDangerous()) {
            if (!this.isSafe(this.position)) {
                var lateEscape = this.findEscapePath(null, null);
                if (lateEscape && lateEscape.length > 1) {
                    this.escapePath = lateEscape;
                    this.escapePathIndex = 1;
                    this.escapeDestination = lateEscape[lateEscape.length - 1];
                    this.setNextTile(lateEscape[1]);
                }
                this.animate('idle');
                return true;
            }

            // We are safely behind cover. If this bot has spare bomb capacity,
            // do not waste it by waiting for every fuse to finish. Evaluate a
            // second (or third) tactical placement against the combined danger
            // map of all bombs already active. This creates rolling bomb chains:
            // plant -> escape -> plant from cover -> escape again.
            if (this.tryChainBombFromCover()) return true;

            this.animate('idle');
            return true;
        }

        this.clearEscapePlan();
        return false;
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

    countWoodInBlast: function(origin, strength) {
        var blast = this.simulatedBlast(origin, strength);
        var count = 0;
        for (var i = 0; i < blast.length; i++) {
            if (gGameEngine.getTileMaterial(blast[i]) === 'wood') count++;
        }
        return count;
    },

    scoreBombPlacement: function(origin) {
        if (!origin || this.hasBomb(origin)) return -999;

        var blast = this.simulatedBlast(origin, this.bombStrength);
        var opponents = gGameEngine.getPlayersAndBots();
        var score = 0;
        var closest = 99;

        for (var i = 0; i < opponents.length; i++) {
            var target = opponents[i];
            if (!target || target === this || !target.alive) continue;

            var direct = false;
            var nearBlast = 99;
            for (var j = 0; j < blast.length; j++) {
                if (Utils.comparePositions(blast[j], target.position)) direct = true;
                nearBlast = Math.min(nearBlast,
                    Math.abs(blast[j].x - target.position.x) + Math.abs(blast[j].y - target.position.y));
            }

            var distance = Math.abs(origin.x - target.position.x) + Math.abs(origin.y - target.position.y);
            closest = Math.min(closest, distance);
            if (direct) score += 120;
            else if (nearBlast === 1) score += 35;
            else if (nearBlast === 2) score += 12;
        }

        // Blowing up useful wood is productive even when no opponent is currently
        // lined up; it opens routes and exposes more power-ups.
        score += this.countWoodInBlast(origin, this.bombStrength) * 18;

        // Extra bomb capacity should create pressure rather than idle inventory.
        // Reward placements that advance toward opponents, but not enough to justify
        // a useless bomb on the far side of the map.
        if (closest < 99) score += Math.max(0, 18 - closest * 2);

        return score;
    },

    tryChainBombFromCover: function() {
        if (this.activeBombCount() >= this.bombsMax) return false;
        if (this.hasBomb(this.position) || !this.isSafe(this.position)) return false;

        var placementScore = this.scoreBombPlacement(this.position);
        // Require a genuinely useful follow-up position. Direct attacks, blast
        // pressure near a target, or clearing wood all exceed this threshold.
        if (placementScore < (this.hyperAggressive ? 3 : 18)) return false;

        var spareAfterPlant = this.bombsMax - (this.activeBombCount() + 1);
        var nextEscape = this.findEscapePath(this.position, this.bombStrength, spareAfterPlant > 0);
        if (!nextEscape || nextEscape.length < 2) return false;

        var chainedBomb = this.plantBomb();
        if (!chainedBomb) return false;

        this.beginEscapePlan(nextEscape, chainedBomb);
        this.setNextTile(nextEscape[1]);
        return true;
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
            var positions = [];
            if (b.exploded) {
                for (var f=0; f<b.fires.length; f++) positions.push(b.fires[f].position);
            } else {
                positions = b.getDangerPositions();
            }
            for (var j=0;j<positions.length;j++) danger[this.key(positions[j])] = true;
        }
        if (extraOrigin) {
            var extra=this.simulatedBlast(extraOrigin, extraStrength || this.bombStrength);
            for (var k=0;k<extra.length;k++) danger[this.key(extra[k])] = true;
        }
        return danger;
    },

    buildDangerTimeMap: function(extraOrigin, extraStrength) {
        var dangerTime = {};
        var fps = createjs.Ticker.getMeasuredFPS() || gGameEngine.fps || 50;
        function mark(self, positions, remainingFrames) {
            for (var i=0; i<positions.length; i++) {
                var k = self.key(positions[i]);
                if (dangerTime[k] === undefined || remainingFrames < dangerTime[k]) {
                    dangerTime[k] = remainingFrames;
                }
            }
        }

        var active = [];
        for (var i=0; i<gGameEngine.bombs.length; i++) {
            var b = gGameEngine.bombs[i];
            if (b.exploded) {
                var activeFire = [];
                for (var f=0; f<b.fires.length; f++) activeFire.push(b.fires[f].position);
                mark(this, activeFire, 0);
                continue;
            }
            active.push({
                bomb: b,
                time: Math.max(1, b.timerMax * fps - b.timer),
                blast: b.getDangerPositions()
            });
        }

        if (extraOrigin) {
            active.push({
                bomb: null,
                position: {x:extraOrigin.x, y:extraOrigin.y},
                time: 2 * fps,
                blast: this.simulatedBlast(extraOrigin, extraStrength || this.bombStrength)
            });
        }

        // Account for chain reactions: if an earlier bomb's fire reaches another
        // bomb, the second bomb detonates at the earlier time rather than waiting
        // for its own fuse. Iterate until those earlier times stop propagating.
        var changed = true;
        var guard = 0;
        while (changed && guard++ < active.length + 2) {
            changed = false;
            for (var a=0; a<active.length; a++) {
                for (var bidx=0; bidx<active.length; bidx++) {
                    if (a === bidx || active[a].time >= active[bidx].time) continue;
                    var targetPos = active[bidx].bomb ? active[bidx].bomb.position : active[bidx].position;
                    for (var q=0; q<active[a].blast.length; q++) {
                        if (Utils.comparePositions(active[a].blast[q], targetPos)) {
                            active[bidx].time = active[a].time;
                            changed = true;
                            break;
                        }
                    }
                }
            }
        }

        for (var m=0; m<active.length; m++) mark(this, active[m].blast, active[m].time);
        return dangerTime;
    },

    findEscapePath: function(extraOrigin, extraStrength, preferChainSetup) {
        var danger = this.buildDangerMap(extraOrigin, extraStrength);
        var dangerTime = this.buildDangerTimeMap(extraOrigin, extraStrength);
        var start={x:this.position.x,y:this.position.y};
        var startKey=this.key(start);
        var queue=[start];
        var visited={}; visited[startKey]=true;
        var parent={};
        var depth={}; depth[startKey]=0;
        var extraKey=extraOrigin ? this.key(extraOrigin) : null;
        var framesPerTile = Math.max(1, Math.ceil(gGameEngine.tileSize / Math.max(1, this.velocity)));
        var safetyFrames = Math.max(5, Math.ceil(framesPerTile * 0.45));
        var maxDepth = Math.max(3, Math.min(10, Math.floor((2 * (gGameEngine.fps || 50) - safetyFrames) / framesPerTile)));

        var firstSafe = null;
        var bestChainSafe = null;
        var bestChainScore = -Infinity;

        while(queue.length) {
            var cur=queue.shift();
            var ck=this.key(cur);
            // A valid cover tile is completely outside all currently projected
            // blast paths. Walls and wood naturally create cover because
            // Bomb.getDangerPositions()/simulatedBlast stop at those blockers.
            if (ck!==startKey && !danger[ck]) {
                if (!firstSafe) firstSafe = ck;
                if (!preferChainSetup) return this.rebuildPath(parent,startKey,ck);

                // When spare bomb capacity remains, prefer cover that doubles as
                // a useful staging point for the next bomb. Safety still comes
                // first: only tiles already outside every projected blast qualify.
                var tactical = this.scoreBombPlacement(cur) - depth[ck] * 2.5;
                if (tactical > bestChainScore) {
                    bestChainScore = tactical;
                    bestChainSafe = ck;
                }
            }
            if (depth[ck] >= maxDepth) continue;
            var dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
            for(var i=0;i<dirs.length;i++) {
                var n={x:cur.x+dirs[i].x,y:cur.y+dirs[i].y};
                var nk=this.key(n);
                if(visited[nk] || !this.inBounds(n)) continue;
                if(gGameEngine.getTileMaterial(n)!=='grass') continue;
                // The just-planted bomb blocks re-entry, but the bot may leave its starting tile.
                if(this.hasBomb(n) || (extraKey && nk===extraKey)) continue;

                var nextDepth = depth[ck] + 1;
                var arrival = nextDepth * framesPerTile;
                var blastAt = dangerTime[nk];
                // It is okay to traverse a future blast lane only if the bot can
                // clear that tile with a margin before the earliest bomb reaches it.
                if (blastAt !== undefined && arrival + safetyFrames >= blastAt) continue;

                visited[nk]=true; parent[nk]=ck; depth[nk]=nextDepth; queue.push(n);
            }
        }

        if (preferChainSetup && bestChainSafe) {
            return this.rebuildPath(parent, startKey, bestChainSafe);
        }
        if (firstSafe) return this.rebuildPath(parent, startKey, firstSafe);
        return null;
    },

    getMostImmediateThreatBomb: function() {
        var best = null;
        var bestRemaining = Infinity;
        var fps = createjs.Ticker.getMeasuredFPS() || gGameEngine.fps || 50;
        for (var i=0; i<gGameEngine.bombs.length; i++) {
            var bomb = gGameEngine.bombs[i];
            if (bomb.exploded) continue;
            var positions = bomb.getDangerPositions();
            var threatens = false;
            for (var j=0; j<positions.length; j++) {
                if (Utils.comparePositions(positions[j], this.position)) { threatens = true; break; }
            }
            if (!threatens) continue;
            var remaining = bomb.timerMax * fps - bomb.timer;
            if (remaining < bestRemaining) { best = bomb; bestRemaining = remaining; }
        }
        return best;
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
        return bomb;
    },

    isSafe: function(position) {
        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            var bomb = gGameEngine.bombs[i];
            if (bomb.exploded) {
                // Fire persists for several animation frames after detonation and
                // is lethal even though the bomb itself is marked exploded.
                for (var f = 0; f < bomb.fires.length; f++) {
                    if (Utils.comparePositions(bomb.fires[f].position, position)) return false;
                }
                continue;
            }
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
        var bots = gGameEngine.bots.slice();
        for (var i = 0; i < bots.length; i++) {
            if (bots[i] === this) {
                Utils.removeFromArray(gGameEngine.bots, bots[i]);
                break;
            }
        }
        if (typeof gGameEngine.handleBotDeath === 'function') gGameEngine.handleBotDeath(this);
    }
});
