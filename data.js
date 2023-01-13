const kickData = [
	[
		[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
		[[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
		[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
		[[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
	],
	[
		[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
		[[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
		[[0, 0], [3, 0], [-3, 0], [3, 1], [-3, 1]],
		[[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
	],
	[
		[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
		[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
		[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
		[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	],
];

const tSpinData = [
	[[-1, -1], [1, -1], [-1, 1], [1, 1]],
	[[1, 1], [1, -1], [-1, 1], [-1, -1]],
	[[-1, 1], [1, 1], [-1, -1], [1, -1]],
	[[-1, -1], [-1, 1], [1, -1], [1, 1]],
]

const kickDataI = [
	[[0, 0], [-1, 0], [2, 0], [-1, 0], [2, 0]],
	[[-1, 0], [0, 0], [0, 0], [0, -1], [0, 2]],
	[[-1, -1], [1, -1], [-2, -1], [1, 0], [-2, 0]],
	[[0, -1], [0, -1], [0, -1], [0, 1], [0, -2]],
];

const kickDataO = [
	[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
];

const scoreData = [
	[0, 100, 300, 500, 800],
	[400, 800, 1200, 1600],
	[100, 200, 400],
]

const commentData = {
	lineClear: ["", "SINGLE", "DOUBLE", "TRIPLE", "QUAD", "PENTRIS", "HEXARIS", "HEXARIS", "OCTRIS", "OCTRIS", "OCTRIS", "OCTRIS", "DODECATRIS", "DODECATRIS", "DODECATRIS", "DODECATRIS", "DECAHEXATRIS", "DECAHEXATRIS", "PERFECTRIS", "PERFECTRIS", "ULTIMATRIS", "KIRBTRIS", "IMPOSSIBILITRIS", "INFINITRIS"],
	spins: ["", "T-SPIN", "T-SPIN MINI"],
	spinColors: ["", "", "#af00ff"],
	// spin: ["O-SPIN", "I-SPIN", "T-SPIN", "L-SPIN", "J-SPIN", "S-SPIN", "Z-SPIN"],
}

const sfxKeys = ["B2B", "LINECLEAR", "TSPIN", "TSPIN_MINI", "COMBOS", "MOVE", "MOVE_FAIL", "MISC"];

const sfxData = {
	B2B: ["b2b_tetris", "b2b_tspin_single", "b2b_tspin_double", "b2b_tspin_triple", "b2b_tspin_mini"],
	LINECLEAR: [null, "single", "double", "triple", "tetris"],
	TSPIN: ["tspin_zero", "tspin_single", "tspin_double", "tspin_triple"],
	TSPIN_MINI: ["tspin_mini", "tspin_mini", "tspin_mini"],
	COMBOS: ["combo1", "combo2", "combo3", "combo4", "combo5", "combo6", "combo7", "combo8", "combo9", "combo10", "combo11", "combo12", "combo13", "combo14", "combo15", "combo16", "combo17", "combo18", "combo19", "combo20"],
	MOVE: ["move", "move", null, "softdrop", "lockdown", "rotate", "rotate", "rotate", "hold"],
	MOVE_FAIL: ["movefail", "movefail", null, "movefail", null, "rotatefail", "rotatefail", "rotatefail", null],
	MISC: ["gameover", "lineattack", "perfectclear", "ko"]
}

/* MOVES */

/*

0	MOVE_LEFT
1	MOVE_RIGHT
2	MOVE_DOWN (Gravity)
3	MOVE_DOWN (Artificial)
4	LOCK
5	ROTATE_CW
6	ROTATE_CCW
7	ROTATE_180
8	HOLD
9	ZONE

*/


const matrices = [
	[
		[1, 1],
		[1, 1],
	],
	[
		[0, 0, 0, 0],
		[2, 2, 2, 2],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	],
	[
		[0, 3, 0],
		[3, 3, 3],
		[0, 0, 0],
	],
	[
		[0, 0, 4],
		[4, 4, 4],
		[0, 0, 0],
	],
	[
		[5, 0, 0],
		[5, 5, 5],
		[0, 0, 0],
	],
	[
		[0, 6, 6],
		[6, 6, 0],
		[0, 0, 0],
	],
	[
		[7, 7, 0],
		[0, 7, 7],
		[0, 0, 0],
	],
]

const pcWidths = [2, 4, 3, 3, 3, 3, 3]
const pcHeights = [2, 1, 2, 2, 2, 2, 2]

const kickDataId = [2, 1, 0, 0, 0, 0, 0]

const spawnLocations = [4, 3, 3, 3, 3, 3, 3];

var PieceI = {
	index: 0,
	x: 2,
	y: -1,
	kickData: kickDataI,
	tetro: [
		[0, 0, 0, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0],
		[0, 0, 1, 0, 0],
	],
};
var PieceJ = {
	index: 1,
	x: 3,
	y: 0,
	kickData: kickData,
	tetro: [
		[2, 2, 0], 
		[0, 2, 0], 
		[0, 2, 0]],
};
var PieceL = {
	index: 2,
	x: 3,
	y: 0,
	kickData: kickData,
	tetro: [
		[0, 3, 0], 
		[0, 3, 0], 
		[3, 3, 0]
	],
};
var PieceO = {
	index: 3,
	x: 4,
	y: 0,
	kickData: kickDataO,
	tetro: [[4, 4], [4, 4]],
};
var PieceS = {
	index: 4,
	x: 3,
	y: 0,
	kickData: kickData,
	tetro: [[0, 5, 0], [5, 5, 0], [5, 0, 0]],
};
var PieceT = {
	index: 5,
	x: 3,
	y: 0,
	kickData: kickData,
	tetro: [[0, 6, 0], [6, 6, 0], [0, 6, 0]],
};
var PieceZ = {
	index: 6,
	x: 3,
	y: 0,
	kickData: kickData,
	tetro: [[7, 0, 0], [7, 7, 0], [0, 7, 0]],
};