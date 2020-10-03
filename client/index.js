var canvas

function setup() {
	canvas = createCanvas(window.innerWidth, window.innerHeight);
}

window.onresize = function() {
  var w = window.innerWidth;
  var h = window.innerHeight;  
  resizeCanvas(w, h);
  width = w;
  height = h;
};

var client = new Colyseus.Client('ws://localhost:2567');
var draw = () => {};
var players = [];
var room;

client.joinOrCreate('room').then(r => {
	room = r;
	console.log(room.sessionId, "joined", room.name);

	room.onError((code, message) => {
		console.log(client.id, "couldn't join", room.name);
	});

	room.state.players.onAdd = function(player, sessionId) {
		console.log("Player added", sessionId);
		players.push(sessionId);
	}

	room.state.players.onRemove = function(player, sessionId) {
		console.log("Player left", sessionId);
	  array.splice(array.indexOf(sessionId), 1);
	}

	room.state.players.onChange = function(player, sessionId) {

	}

	draw = () => {
		update();

		background(0, 0, 0);
	
		fill(255);
	
		players.forEach((id) => {
			var p = room.state.players[id];
			circle(p.x, p.y, 10);
		});
	}
}).catch(e => {
	console.log(e);
});

function update() {
	if (room == undefined) {
		return;
	}

	deltaTime /= 1000;

	if (keyIsDown(UP_ARROW)) {
		room.send("move", { y: -deltaTime * 10 });
	}
}