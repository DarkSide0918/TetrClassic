const pStatTime = document.getElementById("p-stat-content-time");
const pStatPieces = document.getElementById("p-stat-content-pieces");
const pStatScore = document.getElementById("p-stat-content-score");

const pCommentPrimary = document.getElementById("p-comment-primary");
const pCommentSecondary = document.getElementById("p-comment-secondary");

/* PLAYER */

var board = [];
var queue = [];
var queueElements = [0, 1, 2, 3, 4, 5, 6];
var prevMove = "";
var prevKick;
var mainSeed;
var held;
var zonemode = false;
var gameTime;
var gamePieces;
var gameScore;
var startTime;
var dropCounter;
var zoneFill;
var combo;
var locking;

// SERVERSIDE COMMUNICATION

const ws = new WebSocket("ws://localhost:3000");

const size = {
	boardWidth: 10,
	boardHeight: 20,
	clearHeight: 4,
	subWidth: 5,
	scale: 30,
}

function initBoard() {
	for (var i = 0; i < (size.boardHeight + size.clearHeight); i++) {
		board[i] = []
		for (var j = 0; j < size.boardWidth; j++) {
			board[i][j] = 0;
		}
	}
}

function reset() {
	board = [];
	initBoard();

	queue = [];
	queueElements = [0, 1, 2, 3, 4, 5, 6];
	prevMove = "";

	mainSeed = Math.floor(Math.random() * 10000);
	console.log("SEED: " + mainSeed);

	queueController(mainSeed);

	held = -1;

	resetPlayer();

	update();
	renderHold();
	renderQueue();

	gameTime = 0;
	gamePieces = 0;
	gameScore = 0;
	startTime = performance.now();
	dropCounter = 0;
	prevKick = 0;
	combo = 0;
	clearTimeout(autolockTimeout);
	updateStats();

	zoneFill = matrices.length + 1;
}

// Values

const arr = 0;
const sdf = 0;
const lcd = 1000;
const keysDown = [];

const dasKeys = ["ArrowLeft", "ArrowRight", "ArrowDown"]
const arrKeys = ["ArrowLeft", "ArrowRight"];
const dasKeyBreakEx = ["ArrowDown"]
const das = [70, 70, 0];

var autolockTimeout;

function queueController() {
	if (queue.length < queueElements.length) {
		fillQueue();
		for (i in queueElements)
			queue.push(queueElements[parseInt(i)]);
	}
}

function fillQueue() {
	var m = queueElements.length, t, i;
	while (m) {
		i = Math.floor(random() * m--);
		t = queueElements[m];
		queueElements[m] = queueElements[i];
		queueElements[i] = t;
		++mainSeed;
	}
}

function random() {
	var x = Math.sin(mainSeed++) * 10000;
	return x - Math.floor(x);
}

function calculateScore(linesCleared, tspin = 0, pfclear) {
	gameScore += scoreData[tspin][linesCleared];
	updateStats();

	if (linesCleared) {
		pCommentPrimary.innerHTML = commentData.lineClear[linesCleared];
		pCommentPrimary.style.animationName = "";

		clearFX.src = "assets/sound/" + sfxData[tspin][linesCleared];
		clearFX.play();

		requestAnimationFrame(() => {
			setTimeout(() => {
				pCommentPrimary.style.animationName = "comment-text"
			}, 0);
		});
	}

	if (tspin) {
		pCommentSecondary.innerHTML = commentData.spins[tspin];
		pCommentSecondary.style.color = commentData.spinColors[player.piece];
		pCommentSecondary.style.animationName = ""

		requestAnimationFrame(() => {
			setTimeout(() => {
				pCommentSecondary.style.animationName = "comment-text"
			}, 0);
		});
	}
}

function checkTspin(pl) {
	const center = {x: pl.pos.x + 1, y: pl.pos.y + 1};
	if (pl.piece != 2) return 0;
	if (prevMove != "ROTATE_CW" && prevMove != "ROTATE_CCW") return 0;

	if (collides(center.x + tSpinData[pl.rotation][0][0], center.y + tSpinData[pl.rotation][0][1]) && collides(center.x + tSpinData[pl.rotation][1][0], center.y + tSpinData[pl.rotation][1][1]) && (collides(center.x + tSpinData[pl.rotation][2][0], center.y + tSpinData[pl.rotation][2][1]) || collides(center.x + tSpinData[pl.rotation][3][0], center.y + tSpinData[pl.rotation][3][1]))) {
		return 1; // t-spin
	} else if ((collides(center.x + tSpinData[pl.rotation][0][0], center.y + tSpinData[pl.rotation][0][1]) || collides(center.x + tSpinData[pl.rotation][1][0], center.y + tSpinData[pl.rotation][1][1])) && collides(center.x + tSpinData[pl.rotation][2][0], center.y + tSpinData[pl.rotation][2][1]) && collides(center.x + tSpinData[pl.rotation][3][0], center.y + tSpinData[pl.rotation][3][1])) {
		if (prevKick = 4) return 1; // t-spin
		return 2; // t-spin mini
	}

	return 0;
}

function checkLineClear() {
	const newBoard = [];
	var newBoardHeightPointer = size.boardHeight + size.clearHeight - 1;
	var linesCleared = 0;
	var pfclear = true;
	
	for (var i = size.boardHeight + size.clearHeight - 1; i >= 0; i--) {
		newBoard[i] = [];
		var ok = true;
		for (var j = 0; j < size.boardWidth; j++) {
			if (!board[i][j]) {
				ok = false;
				if (!pfclear) break;
			} else pfclear = false;
		}

		if (!ok) {
			newBoard[newBoardHeightPointer] = board[i];
			newBoardHeightPointer--;
		} else {
			linesCleared++;
		}
	}

	if (linesCleared) {
		combo++;
		comboFX.src = "./assets/sound/sfx_combo" + combo.toString() + ".mp3";
		comboFX.play();
	} else {
		combo = 0;
	}
	

	calculateScore(linesCleared, checkTspin(player), pfclear)

	board = newBoard;
}

function checkZoneClear() {
	const newBoard = [];
	var newBoardHeightPointer = size.boardHeight + size.clearHeight - 1;
	var linesCleared = 0;
	var pfclear = true;
	
	for (var i = size.boardHeight + size.clearHeight - 1; i >= 0; i--) {
		newBoard[i] = [];
		var ok = true;
		for (var j = 0; j < size.boardWidth; j++) {
			if (!board[i][j]) {
				ok = false;
				if (!pfclear) break;
			} else pfclear = false;
		}

		if (!ok) {
			newBoard[newBoardHeightPointer] = board[i];
			newBoardHeightPointer--;
		} else {
			linesCleared++;
		}
	}

	for (var i = 0; i < linesCleared; i++) {
		var zoneLine = []
		for (var j = 0; j < size.boardWidth; j++) {
			zoneLine[j] = zoneFill;
		}
		newBoard.shift();
		newBoard.push(zoneLine);
	}

	board = newBoard;

	calculateScore(linesCleared, checkTspin(player), pfclear)
}

const player = {
	pos: { x: 3, y: size.clearHeight },
	piece: 0,
	matrix: matrices[0],
	rotation: 0,
}

function collides(x, y) {
	if (x < 0 || x >= size.boardWidth || y >= size.boardHeight + size.clearHeight || y >= 0 && board[y][x]) return true;	
	return false;
}

function resetPlayer() {
	queueController();
	if (zonemode) checkZoneClear();
	else checkLineClear();
	player.pos.x = Math.floor(size.boardWidth / 2) - Math.ceil(matrices[queue[0]][0].length / 2);
	player.pos.y = size.clearHeight - 1;
	player.rotation = 0;
	player.piece = queue[0];
	player.matrix = matrices[queue[0]];
	clearTimeout(autolockTimeout);
	queue.shift();
	renderQueue();

	checkRepeat();

	if (player_collides(player)) {
		player.pos.y--;
		if (player_collides(player)) {
			if (zonemode) {
				checkLineClear();
				zonemode = false;
			}
		}
	}
}

function lock(pl, mat) {
	for (var i = 0; i < size.boardHeight + size.clearHeight; i++) {
		pl.pos.y++;
		if (player_collides(pl)) pl.pos.y--;
	}

	for (var i = 0; i < pl.matrix.length; i++) {
		for (var j = 0; j < pl.matrix[i].length; j++) {
			if (pl.matrix[i][j]) mat[pl.pos.y + i][pl.pos.x + j] = pl.matrix[i][j];
		}
	}

	clearTimeout(autolockTimeout);
	gamePieces++;
	resetPlayer();
}

function rotate(pl, dir) {
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

		if (!player_collides(pc)) {
			player.pos = pc.pos;
			player.matrix = nmatrix;
			player.rotation = pc.rotation;
			prevKick = k;
			break;
		}

		pc.pos.x -= kickData[kickDataId[pl.piece]][crotation][k][0] - kickData[kickDataId[pl.piece]][nrotation][k][0];
		pc.pos.y -= kickData[kickDataId[pl.piece]][crotation][k][1] - kickData[kickDataId[pl.piece]][nrotation][k][1];
	}
}

function player_collides(pl) {
	for (var i = 0; i < pl.matrix.length; i++)
		for (var j = 0; j < pl.matrix[i].length; j++)
			if (pl.matrix[i][j] && collides(pl.pos.x + j, pl.pos.y + i)) return true;
	return false;
}

function hold(pl) {
	if (held === -1) {
		held = pl.piece;
		queueController();
		player.pos.x = Math.floor(size.boardWidth / 2) - Math.ceil(matrices[queue[0]][0].length / 2);
		player.pos.y = size.clearHeight - 1;
		player.rotation = 0;
		player.piece = queue[0];
		player.matrix = matrices[queue[0]];
		clearTimeout(autolockTimeout);
		queue.shift();
		renderQueue();
	} else {
		const tmpHeld = pl.piece;
		pl.pos.x = Math.floor(size.boardWidth / 2) - Math.ceil(matrices[held][0].length / 2);
		pl.pos.y = size.clearHeight - 1;
		pl.rotation = 0;
		pl.piece = held;
		pl.matrix = matrices[held];
		held = tmpHeld;
		clearTimeout(autolockTimeout);
	}

	renderHold();
}

function zone() {
	if (!zonemode) {
		zonemode = true;
	}
}

function autolock() {
	locking = true;
	// autolockTimeout = setTimeout(conditional_lock, lcd);
	console.log("SETTING TIMEOUT");
}

function conditional_lock() {
	player_move("LOCK");
	locking = false;
}

function player_move(type) {
	var ok = true;
	switch (type) {
		case "MOVE_LEFT":
			player.pos.x--;
			if (player_collides(player)) {
				player.pos.x++;
				ok = false;
				return;
			}
			moveFX.src = "./assets/sound/sfx_move.mp3"
			moveFX.play();
			checkRepeat();
			break;
		case "MOVE_RIGHT":
			player.pos.x++;
			if (player_collides(player)) {
				player.pos.x--;
				ok = false;
				return;
			}
			checkRepeat();
			break;
		case "MOVE_DOWN": // softdrop 
			player.pos.y++;
			if (player_collides(player)) {
				player.pos.y--;
				ok = false;
				if (!locking) autolock();
				return;
			}
			checkRepeat();
			break;
		case "LOCK": // harddrop
			lock(player, board);
			break;
		case "ROTATE_CW":
			rotate(player, 1);
			checkRepeat();
			break;
		case "ROTATE_CCW":
			rotate(player, -1);
			checkRepeat();
			break;
		case "ROTATE_180":
			rotate(player, 2);
			checkRepeat();
			break;
		case "HOLD":
			hold(player);
			checkRepeat();
			break;
		case "ZONE":
			zone();
			break;
	}

	update();
	update_server();

	if (ok) prevMove = type;
}

function checkRepeat() {
	for (i in dasKeys) 
		if (keysDown.includes(dasKeys[i]))
			listenRepeat(dasKeys[i]);
}

function update_server() {
	if (ws.readyState == 1) {
		ws.send(JSON.stringify(player));
	}
}

// function player_move(type) {
// 	const pc = JSON.parse(JSON.stringify(player));
// 	var ok = true;
// 	switch (type) {
// 		case "MOVE_LEFT":
// 			pc.pos.x--;
// 			if (player_collides(pc)) ok = false;
// 			if (ok) player.pos.x--;
// 			break;
// 		case "MOVE_RIGHT":
// 			pc.pos.x++;
// 			if (player_collides(pc)) ok = false;
// 			if (ok) player.pos.x++;
// 			break;
// 		case "MOVE_DOWN": // softdrop 
// 			pc.pos.y++;
// 			if (player_collides(pc)) ok = false;
// 			if (ok) player.pos.y++;
// 			break;
// 		case "LOCK": // harddrop
// 			lock(player, board);
// 			break;
// 		case "ROTATE_CW":
// 			rotate(player, 1);
// 			break;
// 		case "ROTATE_CCW":
// 			rotate(player, -1);
// 			break;
// 		case "ROTATE_180":
// 			break;
// 		case "HOLD":
// 			hold(player);
// 			break;
// 	}
// }

function listenRepeat(code) {
	if (keysDown.includes(code)) {
		if (arrKeys.includes(code)) {
			if (arr == 0) {
				for (var i = 0; i < size.boardWidth; i++)
					keyToAction(code);
			} else {
				keyToAction(code);
				setTimeout(listenRepeat, arr, code);
			}
		} else {
			if (sdf == 0) {
				while (!player_collides(player)) {
					player.pos.y++;
					keyToAction(code);
				}
				player.pos.y--;
				// for (var i = 0; i < size.boardHeight + size.clearHeight; i++)
				// 	keyToAction(code);
			} else {
				keyToAction(code);
				setTimeout(listenRepeat, sdf, code);
			}
		}
	}
}

document.addEventListener('keydown', event => {
	if (!event.repeat) {
		if (dasKeys.includes(event.code)) {
			if (!dasKeyBreakEx.includes(event.code)) {
				for (var i = 0; i < dasKeys.length; i++) {
					if (dasKeyBreakEx.includes(dasKeys[i]) || dasKeys[i] == event.code) {
						continue;
					};
					while (keysDown.includes(dasKeys[i])) {
						keysDown.splice(keysDown.indexOf(dasKeys[i]), 1);
					}
				}
			}
			keyToAction(event.code);
			keysDown.push(event.code);
			setTimeout(listenRepeat, das[dasKeys.indexOf(event.code)], event.code);
		} else {
			keyToAction(event.code);
			keysDown.push(event.code);
		}
	}
});

document.addEventListener('keyup', event => {
	while (keysDown.includes(event.code)) {
		keysDown.splice(keysDown.indexOf(event.code), 1);
	}
});

function keyToAction(code) {
	if (code === "ArrowLeft") {
		player_move("MOVE_LEFT");
	}
	if (code === "ArrowRight") {
		player_move("MOVE_RIGHT");
	}
	if (code === "ArrowDown") {
		player_move("MOVE_DOWN");
	}
	if (code === "Space") {
		player_move("LOCK");
	}
	if (code === "ControlLeft") {
		player_move("ROTATE_180");
	}
	if (code === "KeyX") {
		player_move("ROTATE_CW");
	}
	if (code === "KeyZ") {
		player_move("ROTATE_CCW");
	}
	if (code === "KeyC") {
		player_move("HOLD");
	}
	if (code === "ShiftLeft") {
		player_move("ZONE");
	}

	// console.log(code);

}

function updateRealtimeStats() {
	pStatTime.innerHTML = (gameTime / 1000).toFixed(1) + "s";
	pStatPieces.innerHTML = (gamePieces / gameTime * 1000).toFixed(2) + "pps";
}

function updateStats() {
	pStatScore.innerHTML = gameScore;
}

function fixedUpdate() {
	const currentTime = performance.now();

	// Gravity
	if (((currentTime - startTime) / 1000) >= dropCounter) {
		dropCounter++;
		player_move("MOVE_DOWN");
	}

	gameTime = performance.now() - startTime;
	updateRealtimeStats();
}

const updateInterval = setInterval(fixedUpdate, 100);

/* RENDERER */

let maxPieceHeight = 0;
const queueLength = 6;

for (var i = 0; i < matrices.length; i++) {
	let ok = false;
	for (var j = 0; j < matrices[i].length; j++) {
		for (var k = 0; k < matrices[i][j].length; k++) {
			if (matrices[i][j][k]) {
				maxPieceHeight = max(maxPieceHeight, j);
				break;
			}
		}
	}
}

const canvas = document.getElementById('canvas-field');
const canvasHold = document.getElementById('canvas-hold');
const canvasQueue = document.getElementById('canvas-queue');
const context = canvas.getContext('2d');
const contextHold = canvasHold.getContext('2d');
const contextQueue = canvasQueue.getContext('2d');

canvas.width = size.boardWidth * size.scale;
canvas.height = (size.boardHeight + size.clearHeight) * size.scale;
canvasHold.width = size.subWidth * size.scale;
canvasHold.height = (maxPieceHeight + 2) * size.scale;
canvasQueue.width = size.subWidth * size.scale;
canvasQueue.height = (maxPieceHeight + 2) * queueLength * size.scale;

// context.scale(size.scale, size.scale);
// contextHold.scale(size.scale, size.scale);
// contextQueue.scale(size.scale, size.scale);

context.fillStyle = '#1f1f1f';
context.fillRect(0, 0, canvas.width, canvas.height);
contextHold.fillStyle = '#2f2f2f';
contextHold.fillRect(0, 0, canvasHold.width, canvasHold.height);
contextQueue.fillStyle = '#2f2f2f';
contextQueue.fillRect(0, 0, canvasQueue.width, canvasQueue.height);

const root = document.documentElement;

root.style.setProperty("--canvas-width", (size.boardWidth * size.scale) + "px");
root.style.setProperty("--canvas-height", ((size.boardHeight + size.clearHeight) * size.scale) + "px");
root.style.setProperty("--canvas-subwidth", (size.subWidth * size.scale) + "px");
root.style.setProperty("--canvas-clearheight", (size.clearHeight * size.scale) + "px");

// let dropCounter = 0;
// let dropInterval = 1000;

const colors = ["#df0", "#0de", "#90b", "#d80", "#02b", "#0c0", "#c00"]

function renderQueue() {
	contextQueue.fillStyle = '#2f2f2f';
	contextQueue.fillRect(0, 0, canvasQueue.width, canvasQueue.height);

	for (var i = 0; i < queueLength; i++) {
		const x0 = ((size.subWidth) - pcWidths[queue[i]]) / 2 * size.scale;
		const y0 = ((maxPieceHeight + 2) - pcHeights[queue[i]]) / 2 * size.scale;
		var offsety = 0;

		matrices[queue[i]].forEach((row, y) => {
			var ok = true;
	        row.forEach((value, x) => {
	            if (value != 0) {
	                contextQueue.fillStyle = colors[value - 1];
	                // contextQueue.fillRect(x, i * (maxPieceHeight + 2) + y, 1, 1);
					contextQueue.fillRect(x0 + x * size.scale, y0 + (i * (maxPieceHeight + 2) + y - offsety) * size.scale, size.scale, size.scale);
					// contextQueue.drawImage(skin, skinData[value - 1] * 31, 0, 30, 30, x0 + x * size.scale, y0 + (i * (maxPieceHeight + 2) + y - offsety) * size.scale, size.scale, size.scale);
					ok = false;
	            }
	        });
			if (ok) offsety++;
	    });
	}
}

function renderHold() {
	contextHold.fillStyle = '#2f2f2f';
	contextHold.fillRect(0, 0, canvasQueue.width, canvasQueue.height);

	if (held == -1) return;

	const x0 = ((size.subWidth) - pcWidths[held]) / 2 * size.scale;
	const y0 = ((maxPieceHeight + 2) - pcHeights[held]) / 2 * size.scale;
	var offsety = 0;

	matrices[held].forEach((row, y) => {
		var ok = true;
		row.forEach((value, x) => {
			if (value != 0) {
				contextHold.fillStyle = colors[value - 1];
				// contextHold.fillRect(x, y, 1, 1);
				contextHold.fillRect(x0 + x * size.scale, y0 + (y - offsety) * size.scale, size.scale, size.scale);
				// contextHold.drawImage(skin, skinData[value - 1] * 31, 0, 30, 30, x0 + x * size.scale, y0 + (y - offsety) * size.scale, size.scale, size.scale);
				ok = false;
			}
		});
		if (ok) offsety++;
	});
}

function update(time = 0) {
    render();
}

let timeDifPrevFrame = 0;

const skin = new Image();
skin.src = "./assets/skins/tf.png";
const skinData = [2, 4, 6, 1, 5, 3, 0, 8];

function render() {
    context.fillStyle = '#1f1f1f';
    // context.fillRect(0, 0, size.boardWidth, size.boardHeight);
	context.fillRect(0, 0, canvas.width, canvas.height);

	for (var i = 0; i < size.boardHeight + size.clearHeight; i++) {
        for (var j = 0; j < size.boardWidth; j++) {
			if (board[i][j]) {
				context.fillStyle = colors[board[i][j] - 1];
            	// context.fillRect(j, i, 1, 1);
				context.fillRect(j * size.scale, i * size.scale, size.scale, size.scale);
				// context.drawImage(skin, skinData[board[i][j] - 1] * 31, 0, 30, 30, j * size.scale, i * size.scale, size.scale, size.scale);
			}
        }
    }
	
    render_player(player.matrix, player.pos);
}

function render_player(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value != 0) {
                context.fillStyle = colors[value - 1];
                // context.fillRect(x + offset.x, y + offset.y, 1, 1);
				context.fillRect((x + offset.x) * size.scale, (y + offset.y) * size.scale, size.scale, size.scale);
				// context.drawImage(skin, skinData[value - 1] * 31, 0, 30, 30, (x + offset.x) * size.scale, (y + offset.y) * size.scale, size.scale, size.scale);
            }
        });
    });
}

// AUDIO PROCESSOR 

const comboFX = new Audio();
const clearFX = new Audio();
const moveFX = new Audio();

// AFTERLOAD INITIALIZATION

reset();