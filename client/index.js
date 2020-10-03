window.onresize = function() {
  var w = window.innerWidth;
  var h = window.innerHeight;  
  resizeCanvas(w, h);
  width = w;
  height = h;
};

var client = new Colyseus.Client('ws://localhost:2567');
var draw = () => {};
var players = new Map();
var room;

client.joinOrCreate('room').then(r => {
	room = r;
	console.log(room.sessionId, "joined", room.name);

	room.onError((code, message) => {
		console.log(client.id, "couldn't join", room.name);
	});

	room.state.players.onAdd = function(player, sessionId) {
		console.log("Player added", sessionId);
		players.set(sessionId, sessionId == room.sessionId ? new LocalPlayer(sessionId, room) : new Player(sessionId, room));
	}

	room.state.players.onRemove = function(player, sessionId) {
		console.log("Player left", sessionId);
		players.delete(sessionId);
	}

	setupDraw();
}).catch(e => {
	console.log(e);
});

var canvas
var assets = {}

function setup() {
	canvas = createCanvas(window.innerWidth, window.innerHeight);

	let context = canvas.elt.getContext('2d');
	context.mozImageSmoothingEnabled = false;
	context.webkitImageSmoothingEnabled = false;
	context.msImageSmoothingEnabled = false;
	context.imageSmoothingEnabled = false;

	assets["player"] = loadImage("assets/player.png");
}

function update() {
	if (room == undefined) {
		return;
	}

	deltaTime /= 1000;

	players.forEach((p) => {
		p.update(deltaTime);
	});
}

function setupDraw() {
	draw = () => {
		update();
		background(0, 0, 0);
		scale(4);
	
		players.forEach((p) => {
			p.render();
		});
	}
}