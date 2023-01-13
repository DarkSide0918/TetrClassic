/* PLAYER */

class Player {

	constructor(element, isMainPlayer) {

		this.isMainPlayer = isMainPlayer;

		this.pStatTime = element.querySelector(".p-stat-content-time");
		this.pStatPieces = element.querySelector(".p-stat-content-pieces");
		this.pStatScore = element.querySelector(".p-stat-content-score");
		this.pCommentPrimary = element.querySelector(".p-comment-primary");
		this.pCommentSecondary = element.querySelector(".p-comment-secondary");

		// SERVERSIDE COMMUNICATION

		this.ws = new WebSocket("ws://localhost:3000");

		// GAME VALUES
		this.board = [];
		this.queue = [];
		this.queueElements = [0, 1, 2, 3, 4, 5, 6];
		this.prevMove = "";
		this.prevKick = 0;
		this.mainSeed = 0;
		this.held = -1;
		this.zonemode = false;
		this.gameTime = 0;
		this.gamePieces = 0;
		this.gameScore = 0;
		this.startTime = 0;
		this.gameStartTime = 0;
		this.dropCounter = 0;
		this.zoneFill = 0;
		this.combo = 0;
		this.locking = 0;
		this.repeating = false;
		
		this.arr = 50;
		this.sdf = 50;
		this.lcd = 500;

		this.dasKeys = ["ArrowLeft", "ArrowRight", "ArrowDown"];
		this.arrKeys = ["ArrowLeft", "ArrowRight"];
		this.dasKeyBreakEx = ["ArrowDown"];
		this.das = [200, 200, this.sdf];
		this.keysDown = [];
		this.softDropTimeout;
		this.autolockTimeout;
		this.gravityTimeout;
		this.updateInterval = setInterval(() => { this.fixedUpdate() }, 100);

		this.size = {
			boardWidth: 10,
			boardHeight: 20,
			clearHeight: 4,
			subWidth: 5,
			scale: 30,
		}

		this.player = {
			pos: { x: 3, y: this.size.clearHeight },
			piece: 0,
			matrix: matrices[0],
			rotation: 0,
		}

		// RENDERING

		this.maxPieceHeight = 0;
		this.queueLength = 6;

		for (var i = 0; i < matrices.length; i++) {
			for (var j = 0; j < matrices[i].length; j++) {
				for (var k = 0; k < matrices[i][j].length; k++) {
					if (matrices[i][j][k]) {
						this.maxPieceHeight = max(this.maxPieceHeight, j);
						break;
					}
				}
			}
		}

		this.canvas = element.querySelector('.canvas-field');
		this.canvasHold = element.querySelector('.canvas-hold');
		this.canvasQueue = element.querySelector('.canvas-queue');
		this.context = this.canvas.getContext('2d');
		this.contextHold = this.canvasHold.getContext('2d');
		this.contextQueue = this.canvasQueue.getContext('2d');

		this.canvas.width = this.size.boardWidth * this.size.scale;
		this.canvas.height = (this.size.boardHeight + this.size.clearHeight) * this.size.scale;
		this.canvasHold.width = this.size.subWidth * this.size.scale;
		this.canvasHold.height = (this.maxPieceHeight + 2) * this.size.scale;
		this.canvasQueue.width = this.size.subWidth * this.size.scale;
		this.canvasQueue.height = (this.maxPieceHeight + 2) * this.queueLength * this.size.scale;

		this.context.fillStyle = '#1f1f1f';
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.contextHold.fillStyle = '#2f2f2f';
		this.contextHold.fillRect(0, 0, this.canvasHold.width, this.canvasHold.height);
		this.contextQueue.fillStyle = '#2f2f2f';
		this.contextQueue.fillRect(0, 0, this.canvasQueue.width, this.canvasQueue.height);

		this.root = document.documentElement;

		this.root.style.setProperty("--canvas-width", (this.size.boardWidth * this.size.scale) + "px");
		this.root.style.setProperty("--canvas-height", ((this.size.boardHeight + this.size.clearHeight) * this.size.scale) + "px");
		this.root.style.setProperty("--canvas-subwidth", (this.size.subWidth * this.size.scale) + "px");
		this.root.style.setProperty("--canvas-clearheight", (this.size.clearHeight * this.size.scale) + "px");

		this.colors = ["#df0", "#0de", "#90b", "#d80", "#02b", "#0c0", "#c00"];

		this.skin = new Image();
		this.skin.src = "./assets/skins/tf.png";
		this.skinData = [2, 4, 6, 1, 5, 3, 0, 8];

		this.reset();

		if (this.isMainPlayer) {
			this.audioWrapper = document.getElementById("div-audio");
			this.audioElements = [];
			this.loadAudio()
		};
	}

	updateRealtimeStats() {
		this.pStatTime.innerHTML = (this.gameTime / 1000).toFixed(1) + "s";
		this.pStatPieces.innerHTML = (this.gamePieces / this.gameTime * 1000).toFixed(2) + "pps";
	}
	
	updateStats() {
		this.pStatScore.innerHTML = this.gameScore;
	}
	
	fixedUpdate() {
		const currentTime = performance.now();
	
		// Gravity
		if (Math.floor((currentTime - this.startTime) / 1000)) {
			this.startTime = currentTime;
			this.player_move("MOVE_DOWN");
		}
	
		this.gameTime = currentTime - this.gameStartTime;
		this.updateRealtimeStats();
	}

	initBoard() {
		for (var i = 0; i < (this.size.boardHeight + this.size.clearHeight); i++) {
			this.board[i] = []
			for (var j = 0; j < this.size.boardWidth; j++) {
				this.board[i][j] = 0;
			}
		}
	}

	reset() {
		const currentTime = performance.now();

		this.board = [];
		this.initBoard();
	
		this.queue = [];
		this.queueElements = [0, 1, 2, 3, 4, 5, 6];
		this.prevMove = "";
	
		this.mainSeed = Math.floor(Math.random() * 10000);
		console.log("SEED: " + this.mainSeed);
	
		this.queueController(this.mainSeed);
	
		this.held = -1;
	
		this.resetPlayer();
	
		this.update();
		this.renderHold();
		this.renderQueue();
	
		this.gameTime = 0;
		this.gamePieces = 0;
		this.gameScore = 0;
		this.startTime = currentTime;
		this.gameStartTime = currentTime;
		this.dropCounter = 0;
		this.prevKick = 0;
		this.combo = 0;
		this.repeating = false;
		this.autolock(false);
		this.updateStats();
	
		this.zoneFill = matrices.length + 1;
	}

	queueController() {
		if (this.queue.length < this.queueElements.length) {
			this.fillQueue();
			for (var i = 0; i < this.queueElements.length; i++)
				this.queue.push(this.queueElements[parseInt(i)]);
		}
	}
	
	fillQueue() {
		var m = this.queueElements.length, t, i;
		while (m) {
			i = Math.floor(this.random() * m--);
			t = this.queueElements[m];
			this.queueElements[m] = this.queueElements[i];
			this.queueElements[i] = t;
			this.mainSeed++;
		}
	}
	
	random() {
		var x = Math.sin(this.mainSeed++) * 10000;
		return x - Math.floor(x);
	}

	calculateScore(linesCleared, tspin = 0, pfclear) {
		this.gameScore += scoreData[tspin][linesCleared];
		this.updateStats();
	
		if (tspin) {
			this.pCommentSecondary.innerHTML = commentData.spins[tspin];
			this.pCommentSecondary.style.color = commentData.spinColors[this.player.piece];
			this.pCommentSecondary.style.animationName = ""
	
			requestAnimationFrame(() => {
				setTimeout(() => {
					this.pCommentSecondary.style.animationName = "comment-text"
				}, 0);
			});

			if (tspin == 1) {
				this.playSFX("TSPIN", linesCleared);
			} else {
				this.playSFX("TSPIN_MINI", linesCleared);
			}
		}
		
		if (linesCleared) {
			this.pCommentPrimary.innerHTML = commentData.lineClear[linesCleared];
			this.pCommentPrimary.style.animationName = "";
	
			requestAnimationFrame(() => {
				setTimeout(() => {
					this.pCommentPrimary.style.animationName = "comment-text"
				}, 0);
			});

			if (!tspin) this.playSFX("LINECLEAR", linesCleared);
		}
	}

	checkTspin(pl) {
		const center = {x: pl.pos.x + 1, y: pl.pos.y + 1};
		if (pl.piece != 2) return 0;
		if (this.prevMove != "ROTATE_CW" && this.prevMove != "ROTATE_CCW") return 0;
	
		if (this.collides(center.x + tSpinData[pl.rotation][0][0], center.y + tSpinData[pl.rotation][0][1]) && this.collides(center.x + tSpinData[pl.rotation][1][0], center.y + tSpinData[pl.rotation][1][1]) && (this.collides(center.x + tSpinData[pl.rotation][2][0], center.y + tSpinData[pl.rotation][2][1]) || this.collides(center.x + tSpinData[pl.rotation][3][0], center.y + tSpinData[pl.rotation][3][1]))) {
			return 1; // t-spin
		} else if ((this.collides(center.x + tSpinData[pl.rotation][0][0], center.y + tSpinData[pl.rotation][0][1]) || this.collides(center.x + tSpinData[pl.rotation][1][0], center.y + tSpinData[pl.rotation][1][1])) && this.collides(center.x + tSpinData[pl.rotation][2][0], center.y + tSpinData[pl.rotation][2][1]) && this.collides(center.x + tSpinData[pl.rotation][3][0], center.y + tSpinData[pl.rotation][3][1])) {
			if (this.prevKick == 4) return 1; // t-spin
			return 2; // t-spin mini
		}
	
		return 0;
	}

	checkLineClear() {
		const newBoard = [];
		var newBoardHeightPointer = this.size.boardHeight + this.size.clearHeight - 1;
		var linesCleared = 0;
		var pfclear = true;
		
		for (var i = this.size.boardHeight + this.size.clearHeight - 1; i >= 0; i--) {
			newBoard[i] = [];
			var ok = true;
			for (var j = 0; j < this.size.boardWidth; j++) {
				if (!this.board[i][j]) {
					ok = false;
					if (!pfclear) break;
				} else pfclear = false;
			}
	
			if (!ok) {
				newBoard[newBoardHeightPointer] = this.board[i];
				newBoardHeightPointer--;
			} else {
				linesCleared++;
			}
		}
	
		if (linesCleared) {
			this.combo++;
		} else {
			this.combo = 0;
		}
		
	
		this.calculateScore(linesCleared, this.checkTspin(this.player), pfclear)
	
		this.board = newBoard;
	}

	checkZoneClear() {
		const newBoard = [];
		var newBoardHeightPointer = this.size.boardHeight + this.size.clearHeight - 1;
		var linesCleared = 0;
		var pfclear = true;
		
		for (var i = this.size.boardHeight + this.size.clearHeight - 1; i >= 0; i--) {
			newBoard[i] = [];
			var ok = true;
			for (var j = 0; j < this.size.boardWidth; j++) {
				if (!this.board[i][j]) {
					ok = false;
					if (!pfclear) break;
				} else pfclear = false;
			}
	
			if (!ok) {
				newBoard[newBoardHeightPointer] = this.board[i];
				newBoardHeightPointer--;
			} else {
				linesCleared++;
			}
		}
	
		for (var i = 0; i < linesCleared; i++) {
			var zoneLine = []
			for (var j = 0; j < this.size.boardWidth; j++) {
				zoneLine[j] = this.zoneFill;
			}
			newBoard.shift();
			newBoard.push(zoneLine);
		}
	
		this.board = newBoard;
	
		this.calculateScore(linesCleared, checkTspin(this.player), pfclear)
	}

	collides(x, y) {
		if (x < 0 || x >= this.size.boardWidth || y >= this.size.boardHeight + this.size.clearHeight || y >= 0 && this.board[y][x]) return true;	
		return false;
	}

	player_collides(pl) {
		for (var i = 0; i < pl.matrix.length; i++)
			for (var j = 0; j < pl.matrix[i].length; j++)
				if (pl.matrix[i][j] && this.collides(pl.pos.x + j, pl.pos.y + i)) return true;
		return false;
	}

	resetPlayer() {
		this.queueController();
		if (this.zonemode) this.checkZoneClear();
		else this.checkLineClear();
		this.player.pos.x = Math.floor(this.size.boardWidth / 2) - Math.ceil(matrices[this.queue[0]][0].length / 2);
		this.player.pos.y = this.size.clearHeight - 1;
		this.player.rotation = 0;
		this.player.piece = this.queue[0];
		this.player.matrix = matrices[this.queue[0]];
		this.prevKick = 0;
		this.prevMove = "";
		this.autolock(false);
		this.queue.shift();
		this.renderQueue();
	
		this.checkRepeat();
	
		if (this.player_collides(this.player)) {
			this.player.pos.y--;
			if (this.player_collides(this.player)) {
				if (this.zonemode) {
					this.checkLineClear();
					this.zonemode = false;
				}
			}
		}
	}
	
	lock(pl, mat) {
		for (var i = 0; i < this.size.boardHeight + this.size.clearHeight; i++) {
			this.player_move("MOVE_DOWN");
		}
	
		for (var i = 0; i < pl.matrix.length; i++) {
			for (var j = 0; j < pl.matrix[i].length; j++) {
				if (pl.matrix[i][j]) mat[pl.pos.y + i][pl.pos.x + j] = pl.matrix[i][j];
			}
		}
	
		this.locking = false;
		this.gamePieces++;
		this.resetPlayer();
	}

	rotate(pl, dir) {
		const pc = JSON.parse(JSON.stringify(pl));
	
		var nmatrix = [];
	
		for (var i = 0; i < pl.matrix.length; i++) {
			var nrow = [];
			for (var j = 0; j < pl.matrix[i].length; j++) {
				if (dir === 1) {
					nrow.push(pl.matrix[pl.matrix.length - j - 1][i]);
				} else if (dir === -1) {
					nrow.push(pl.matrix[j][pl.matrix.length - i - 1]);
				} else if (dir === 2) {
					nrow.push(pl.matrix[pl.matrix.length - i - 1][pl.matrix.length - j - 1]);
				}
			}
			nmatrix.push(nrow);
		}
	
		var crotation = ((pc.rotation % 4) + 4) % 4;
		var nrotation = (((pc.rotation + dir) % 4) + 4) % 4;
		pc.rotation = nrotation;
	
		pc.matrix = nmatrix;
	
		for (var k = 0; k < 5; k++) {
	
			pc.pos.x += kickData[kickDataId[pl.piece]][crotation][k][0] - kickData[kickDataId[pl.piece]][nrotation][k][0];
			pc.pos.y += kickData[kickDataId[pl.piece]][crotation][k][1] - kickData[kickDataId[pl.piece]][nrotation][k][1];
	
			if (!this.player_collides(pc)) {
				pl.pos = pc.pos;
				pl.matrix = nmatrix;
				pl.rotation = pc.rotation;
				this.prevKick = k;

				break;
			}
	
			pc.pos.x -= kickData[kickDataId[pl.piece]][crotation][k][0] - kickData[kickDataId[pl.piece]][nrotation][k][0];
			pc.pos.y -= kickData[kickDataId[pl.piece]][crotation][k][1] - kickData[kickDataId[pl.piece]][nrotation][k][1];
		}
	}

	hold(pl) {
		if (this.held === -1) {
			this.held = pl.piece;
			this.queueController();
			this.player.pos.x = Math.floor(this.size.boardWidth / 2) - Math.ceil(matrices[this.queue[0]][0].length / 2);
			pl.pos.y = this.size.clearHeight - 1;
			pl.rotation = 0;
			pl.piece = this.queue[0];
			pl.matrix = matrices[this.queue[0]];
			this.queue.shift();
			this.renderQueue();
		} else {
			const tmpHeld = pl.piece;
			pl.pos.x = Math.floor(this.size.boardWidth / 2) - Math.ceil(matrices[this.held][0].length / 2);
			pl.pos.y = this.size.clearHeight - 1;
			pl.rotation = 0;
			pl.piece = this.held;
			pl.matrix = matrices[this.held];
			this.held = tmpHeld;
		}
	
		this.renderHold();
	}
	
	zone() {
		if (!this.zonemode) {
			this.zonemode = true;
		}
	}
	
	autolock(activate) {
		if (activate) {
			this.locking = true;
			this.autolockTimeout = setTimeout(() => { this.conditional_lock() }, this.lcd);
		} else {
			this.locking = false;
			clearTimeout(this.autolockTimeout);
			this.startTime = performance.now();
		}
	}
	
	conditional_lock() {
		
		this.player_move("LOCK");
		this.locking = false;
	}

	player_move(type) {
		var ok = true;
		switch (type) {
			case "MOVE_LEFT":
				this.player.pos.x--;
				if (this.player_collides(this.player)) {
					this.player.pos.x++;
					ok = false;
					return false;
				}
				if (this.sdf == 0) this.checkRepeat();
				this.playSFX("MOVE", 0);
				break;
			case "MOVE_RIGHT":
				this.player.pos.x++;
				if (this.player_collides(this.player)) {
					this.player.pos.x--;
					ok = false;
					return false;
				}
				if (this.sdf == 0) this.checkRepeat();
				this.playSFX("MOVE", 1);
				break;
			case "MOVE_DOWN": // gravity 
				this.player.pos.y++;
				if (this.player_collides(this.player)) {
					this.player.pos.y--;
					ok = false;
					return false;
				}
				if (this.arr == 0) this.checkRepeat();
				this.playSFX("MOVE", 2);
				break;
			case "MOVE_DOWN_ARTIFICIAL": // softdrop 
				this.player.pos.y++;
				if (this.player_collides(this.player)) {
					this.player.pos.y--;
					ok = false;
					return false;
				}
				if (this.arr == 0) this.checkRepeat();
				this.playSFX("MOVE", 3);
				break;
			case "LOCK": // harddrop
				this.lock(this.player, this.board);
				this.playSFX("MOVE", 4);
				break;
			case "ROTATE_CW":
				this.rotate(this.player, 1);
				this.playSFX("MOVE", 5);
				if (this.sdf == 0 || this.arr == 0) this.checkRepeat();
				break;
			case "ROTATE_CCW":
				this.rotate(this.player, -1);
				this.playSFX("MOVE", 6);
				if (this.sdf == 0 || this.arr == 0) this.checkRepeat();
				break;
			case "ROTATE_180":
				this.rotate(this.player, 2);
				this.playSFX("MOVE", 7);
				if (this.sdf == 0 || this.arr == 0) this.checkRepeat();
				break;
			case "HOLD":
				this.hold(this.player);
				this.playSFX("MOVE", 8);
				if (this.sdf == 0 || this.arr == 0) this.checkRepeat();
				break;
			case "ZONE":
				this.zone();
				this.playSFX("MOVE", 9);
				break;
		}
	
		this.update();
		this.autolock(false);
		this.tryMoveDown();
		// this.update_server();
	
		if (ok) this.prevMove = type;
		return true;
	}
	
	tryMoveDown() {
		this.player.pos.y++;
		if (this.player_collides(this.player) && !this.locking) this.autolock(true);
		this.player.pos.y--;
	}
	
	checkRepeat() {
		for (var i = 0; i < this.dasKeys.length; i++)
			if (this.keysDown.includes(this.dasKeys[i])) 
				this.listenRepeat(this.dasKeys[i]); 
	}
	
	update_server() {
		if (this.ws.readyState == 1) {
			this.ws.send(JSON.stringify(this.player));
		}
	}

	listenRepeat(code) {
		if (this.keysDown.includes(code)) {
			if (this.arrKeys.includes(code)) {
				if (this.arr == 0) {
					for (var i = 0; i < this.size.boardWidth; i++)
						this.keyToAction(code);
				} else {
					this.keyToAction(code);
					setTimeout(() => { this.listenRepeat(code) }, this.arr);
				}
			} else {
				if (this.sdf == 0) {
					for (var i = 0; i < this.size.boardHeight + this.size.clearHeight; i++)
						this.keyToAction(code);
				} else {
					this.keyToAction(code);
					setTimeout(() => { this.listenRepeat(code) }, this.sdf);
				}
			}
		}
	}

	keyToAction(code) {
		if (code === "ArrowLeft") {
			this.player_move("MOVE_LEFT");
		} else if (code === "ArrowRight") {
			this.player_move("MOVE_RIGHT");
		} else if (code === "ArrowDown") {
			this.player_move("MOVE_DOWN_ARTIFICIAL");
		} else if (code === "Space") {
			this.player_move("LOCK");
		} else if (code === "KeyX") {
			this.player_move("ROTATE_CW");
		} else if (code === "KeyZ") {
			this.player_move("ROTATE_CCW");
		} else if (code === "KeyC") {
			this.player_move("ROTATE_180");
		} else if (code === "ShiftLeft") {
			this.player_move("HOLD");
		} else if (code === "ControlLeft") {
			// this.player_move("ZONE");
		} else if (code === "KeyR") {
			this.reset();
		}
	
	}

	// RENDERING

	renderQueue() {
		this.contextQueue.fillStyle = '#2f2f2f';
		this.contextQueue.fillRect(0, 0, this.canvasQueue.width, this.canvasQueue.height);
	
		for (var i = 0; i < this.queueLength; i++) {
			const x0 = ((this.size.subWidth) - pcWidths[this.queue[i]]) / 2 * this.size.scale;
			const y0 = ((this.maxPieceHeight + 2) - pcHeights[this.queue[i]]) / 2 * this.size.scale;
			var offsety = 0;
	
			matrices[this.queue[i]].forEach((row, y) => {
				var ok = true;
				row.forEach((value, x) => {
					if (value != 0) {
						this.contextQueue.fillStyle = this.colors[value - 1];
						// contextQueue.fillRect(x, i * (maxPieceHeight + 2) + y, 1, 1);
						this.contextQueue.fillRect(x0 + x * this.size.scale, y0 + (i * (this.maxPieceHeight + 2) + y - offsety) * this.size.scale, this.size.scale, this.size.scale);
						// contextQueue.drawImage(skin, skinData[value - 1] * 31, 0, 30, 30, x0 + x * size.scale, y0 + (i * (maxPieceHeight + 2) + y - offsety) * size.scale, size.scale, size.scale);
						ok = false;
					}
				});
				if (ok) offsety++;
			});
		}
	}
	
	renderHold() {
		this.contextHold.fillStyle = '#2f2f2f';
		this.contextHold.fillRect(0, 0, this.canvasQueue.width, this.canvasQueue.height);
	
		if (this.held == -1) return;
	
		const x0 = ((this.size.subWidth) - pcWidths[this.held]) / 2 * this.size.scale;
		const y0 = ((this.maxPieceHeight + 2) - pcHeights[this.held]) / 2 * this.size.scale;
		var offsety = 0;
	
		matrices[this.held].forEach((row, y) => {
			var ok = true;
			row.forEach((value, x) => {
				if (value != 0) {
					this.contextHold.fillStyle = this.colors[value - 1];
					// contextHold.fillRect(x, y, 1, 1);
					this.contextHold.fillRect(x0 + x * this.size.scale, y0 + (y - offsety) * this.size.scale, this.size.scale, this.size.scale);
					// contextHold.drawImage(skin, skinData[value - 1] * 31, 0, 30, 30, x0 + x * size.scale, y0 + (y - offsety) * size.scale, size.scale, size.scale);
					ok = false;
				}
			});
			if (ok) offsety++;
		});
	}
	
	update(time = 0) {
		this.render();
	}

	render() {
		this.context.fillStyle = '#1f1f1f';
		// context.fillRect(0, 0, size.boardWidth, size.boardHeight);
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
	
		for (var i = 0; i < this.size.boardHeight + this.size.clearHeight; i++) {
			for (var j = 0; j < this.size.boardWidth; j++) {
				if (this.board[i][j]) {
					this.context.fillStyle = this.colors[this.board[i][j] - 1];
					// context.fillRect(j, i, 1, 1);
					this.context.fillRect(j * this.size.scale, i * this.size.scale, this.size.scale, this.size.scale);
					// context.drawImage(skin, skinData[board[i][j] - 1] * 31, 0, 30, 30, j * size.scale, i * size.scale, size.scale, size.scale);
				}
			}
		}
		
		this.render_player(this.player.matrix, this.player.pos);
	}
	
	render_player(matrix, offset) {
		matrix.forEach((row, y) => {
			row.forEach((value, x) => {
				if (value != 0) {
					this.context.fillStyle = this.colors[value - 1];
					// context.fillRect(x + offset.x, y + offset.y, 1, 1);
					this.context.fillRect((x + offset.x) * this.size.scale, (y + offset.y) * this.size.scale, this.size.scale, this.size.scale);
					// context.drawImage(skin, skinData[value - 1] * 31, 0, 30, 30, (x + offset.x) * size.scale, (y + offset.y) * size.scale, size.scale, size.scale);
				}
			});
		});
	}

	handleKeyDown(event) {
		if (event.repeat) return;
		if (this.dasKeys.includes(event.code)) {
			if (!this.dasKeyBreakEx.includes(event.code)) {
				for (var i = 0; i < this.dasKeys.length; i++) {
					if (this.dasKeyBreakEx.includes(this.dasKeys[i]) || this.dasKeys[i] == event.code) continue;
					while (this.keysDown.includes(this.dasKeys[i])) {
						this.keysDown.splice(this.keysDown.indexOf(this.dasKeys[i]), 1);
					}
				}
			} 

			this.keyToAction(event.code);
			this.keysDown.push(event.code);
			clearTimeout(this.softDropTimeout);
			this.softDropTimeout = setTimeout(() => {this.listenRepeat(event.code)}, this.das[this.dasKeys.indexOf(event.code)]);
		} else {
			this.keyToAction(event.code);
			this.keysDown.push(event.code);
		}
	}

	handleKeyUp(event) {
		while (this.keysDown.includes(event.code)) {
			this.keysDown.splice(this.keysDown.indexOf(event.code), 1);
		}
	}

	playSFX(type, x) {
		if (!this.isMainPlayer || this.audioElements[type][x] === null) return;
		this.audioElements[type][x].currentTime = 0;
		this.audioElements[type][x].play();
	}

	// AUDIO

	loadAudio() {
		for (var i = 0; i < sfxKeys.length; i++) {
			this.audioElements[sfxKeys[i]] = [];
			for (var j = 0; j < sfxData[sfxKeys[i]].length; j++) {
				if (sfxData[sfxKeys[i]][j] === null) {
					this.audioElements[sfxKeys[i]][j] = null;
				} else {
					const sfxElement = document.createElement("audio");
					sfxElement.src = "./assets/sound/sfx_" + sfxData[sfxKeys[i]][j] + ".mp3";
					sfxElement.load();
					sfxElement.volume = 0.2;
					this.audioWrapper.appendChild(sfxElement);
					this.audioElements[sfxKeys[i]][j] = sfxElement;
				}
			}
		}
	}

	pauseInstance() {
		clearTimeout(this.softDropTimeout);
		clearTimeout(this.autolockTimeout);
		clearTimeout(this.gravityTimeout);
		clearInterval(this.updateInterval);
	}

	resumeInstance() {

	}
}

// AFTERLOAD INITIALIZATION

const htmlPlayerTemplate = document.getElementById("template-player-template");
const htmlGameWrapper = document.getElementById("div-game-wrapper");

let playerInstances = [];
let playerElements = [];

function spawnPlayer() {
	if (!playerInstances.length) {
		const newElement = document.importNode(htmlPlayerTemplate.content, true).children[0];
		const newPlayer = new Player(newElement, true);

		document.addEventListener('keydown', keyDownEvent = event => {
			newPlayer.handleKeyDown(event);
		});
		
		document.addEventListener('keyup', keyUpEvent = event => {
			newPlayer.handleKeyUp(event);
		});

		playerInstances.push(newPlayer);
		playerElements.push(newElement);
		htmlGameWrapper.appendChild(newElement);
	} else {
		const newElement = document.importNode(htmlPlayerTemplate.content, true).children[0];
		const newPlayer = new Player(newElement, false);
		playerInstances.push(newPlayer);
		playerElements.push(newElement);
		htmlGameWrapper.appendChild(newElement);
	}
}

function resumePlayer() {}

function PausePlayer(id) {
	htmlGameWrapper.removeChild(playerElements[id]);

	if (!id) {
		document.removeEventListener('keydown', keyDownEvent);
		document.removeEventListener('keyup', keyUpEvent);
	}
}

spawnPlayer();