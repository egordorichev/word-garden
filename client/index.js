const SCALE = 4
const HOST = "localhost"

var client = new Colyseus.Client(`ws://${HOST}:2567`);
var draw = () => {};
var players = new Map();
var playerArray = [];
var room;
var localPlayer;
var cx = 0;
var cy = 0;
var man = null;
var timeLeft = 0;
var npc = [];

var t = getCookie("timer");

if (typeof(t) == "string") {
	try {
		timeLeft = Math.max(0, 60 - (new Date() - new Date(t)) / 1000)
	} catch (e) {
		timeLeft = 60
	}

	if (timeLeft > 0) {
		showTime()
	}
}

function addNpc(n, x, y) {
	n.x = x
	n.y = y
	npc.push(n)
}

function setupConnect(r) {
	players = new Map();
	playerArray = [];
	npc = [];
	document.getElementById("chat-container").classList.remove("hidden");

	room = r;
	room.send("create", getCookie("name") || "undefined");

	room.onError((code, message) => {
		console.log(client.id, "couldn't join", room.name);
	});

	room.state.players.onAdd = function(player, sessionId) {
		var local = sessionId == room.sessionId;
		var player = local ? new LocalPlayer(sessionId, room) : new Player(sessionId, room);

		if (local) {
			localPlayer = player;
			cx = player.x;
			cy = player.y;

			if (getCookie("man") != "baguette") {
				document.getElementById("chat-container").classList.add("hidden");

				man = new Man();
				man.x = cx;
				man.y = cy - 8;
			}

			addNpc(new Baguette(), 128, 128);
			addNpc(new Dino(), -256, 64)
		}

		players.set(sessionId, player);
		playerArray.push(player);
	}

	room.state.players.onRemove = function(player, sessionId) {
		playerArray.splice(playerArray.indexOf(players.get(sessionId)), 1);
		players.delete(sessionId);
	}

	room.onMessage("data", data => {
		room.data = data;
	});

	room.onMessage("add_data", message => {
		if (!room.data) {
			room.data = [];
		}

		room.data.push(message);
	});

	room.onMessage("shutdown", message => {
		room.leave();
		failConnect(`Socket error code: ${message}`);
	})

	room.onLeave((code) => {
		// We left okay
		if (code == 1000 || code == 1001) {
			return;
		}

		failConnect(`Socket error code: ${code}`);
	})

	setupDraw();
}

tryConnect = () => {
	document.getElementById("chat-container").classList.add("hidden");
	client.joinOrCreate('room').then(setupConnect).catch(failConnect);
}

function failConnect(e) {
	console.log(e);

	draw = () => {
		background(0);
		fill(255);
		noStroke();
		textSize(16);
		textStyle(NORMAL);
		textAlign(LEFT, TOP);

		text("Failed to connect to the server, attempting to reconnect", 10, 10);
	};

	setTimeout(tryConnect, 1000);
}

// tryConnect();

var assets = {}

function preload() {
	soundFormats('wav', 'mp3');

	assets["talk"] = loadSound("assets/talk.wav");
	assets["open"] = loadSound("assets/open.wav");
	assets["close"] = loadSound("assets/close.wav");

	// Aka not in dev mode
	if (HOST != "localhost") {
		assets["music"] = loadSound("assets/ld47.mp3", playSoundtrack);
	}
}

function setup() {
	canvas = createCanvas(window.innerWidth, window.innerHeight);

	context = canvas.elt.getContext('2d');
	context.mozImageSmoothingEnabled = false;
	context.webkitImageSmoothingEnabled = false;
	context.msImageSmoothingEnabled = false;
	context.imageSmoothingEnabled = false;

	assets["player"] = loadImage("assets/player.png");
	assets["man"] = loadImage("assets/man.png");
	assets["dino"] = loadImage("assets/dino.png");
	assets["baguette"] = loadImage("assets/baguette.png");
}

function playSoundtrack() {
	setTimeout(() => {
		var music = assets["music"];
	
		music.play();
		music.loop();
	}, 10000)
}

window.onresize = () => {
	if (typeof resizeCanvas !== 'undefined') {
		resizeCanvas(window.innerWidth, window.innerHeight);
	}
}

function update() {
	deltaTime /= 1000;

	if (timeLeft > 0) {
		timeLeft -= deltaTime;

		if (timeLeft < 0) {
			timeLeft = 0;
		}
	}

	if (room == undefined) {
		return;
	}

	playerArray.forEach((p) => {
		p.update(deltaTime);
	});

	npc.forEach((p) => {
		p.update(deltaTime);
	});

	man?.update(deltaTime);
	playerArray.sort((a, b) => a.y > b.y ? 1 : -1);
}

document.addEventListener("keydown", (e) => {
	if (room && !(room.inputBlocked || (localPlayer && localPlayer.talking))) {
		if (e.code == "t" || e.code == "/") {
			input.focus();
			e.preventDefault();
		} else if (e.code == "Space") {
			setModalEnabled(true);
			e.preventDefault();
		}
	}

	if (e.code == "Escape") {
		if (localPlayer && localPlayer.talkingTo && localPlayer.talkingTo.sprite != "man") {
			localPlayer.talkingTo.stopTalking();
		} else {
			event.preventDefault();
			cancel.click();
		}
	}
});

function setupDraw() {
	draw = () => {
		update();

		push();
		translate(width * 0.5, height * 0.5)

		background(0);
		scale(SCALE);

		var skip = false

		if (localPlayer) {
			skip = localPlayer.talking
			/*var dx = localPlayer.x - cx;
			var dy = localPlayer.y - cy;
			var d = Math.sqrt(dx * dx + dy * dy);

			if (d > 32) {
				cx = dx;
				cy = dy;
			} else if (d > 1) {
				var s = deltaTime * 5;
			
				cx += (dx) * s;
				cy += (dy) * s;
			}*/

			cx = localPlayer.x
			cy = localPlayer.y

			translate(-cx - 4, -cy - 4);
		}

		if (skip) {
			localPlayer.render();
		} else {
			stroke(100, 100, 100, 25);	
			strokeWeight(1);

			const doubleScale = 2 * SCALE;

			for (var x = (cx - width / doubleScale) - cx % 32; x <= cx + 8 + width / doubleScale; x += 32) {
				line(x, cy - height / doubleScale, x, cy + 8 + height / doubleScale);
			}

			for (var y = (cy - height / doubleScale) - cy % 32; y <= cy + 8 + height / doubleScale; y += 32) {
				line(cx - width / doubleScale, y, cx + 8 + width / doubleScale, y);
			}
			
			noStroke();

			if (room.data) {
				room.data.forEach((d) => {
					var x = d[0]
					var y = d[1]

					if (Math.abs(cx - x) > width / SCALE * 0.75 || Math.abs(cy - y) > height / SCALE * 0.75) {
						return
					}

					var w = textWidth(d[2])

					fill(0, 0, 0, 255)
					rect(x - w * 0.5 - 1, y - 13, w + 2, 12)

					var color = d[4]

					if (color) {
						color = playerColors[figureOutColor(color, playerColors.length)]
						fill(color[0], color[1], color[2]);
					} else {
						fill(255);
					}

					textSize(4);
					textAlign(CENTER, BOTTOM);
					text(d[3], x - 32, y - 2, 64);

					if (color) {
						fill(color[0] * 0.5, color[1] * 0.5, color[2] * 0.5);
					} else {
						fill(200);
					}

					text(d[2], x - 32, y - 8, 64);
				});
			}
		
			playerArray.forEach((p) => {
				if (Math.abs(p.x - cx) > width / SCALE * 0.75 || Math.abs(p.y - cy) > height / SCALE * 0.75) {
					return
				}

				p.render();
			});
		}

		if (man != null && !(Math.abs(man.x - cx) > width / SCALE * 0.75 || Math.abs(man.y - cy) > height / SCALE * 0.75)) {
			man.render();
		}

		npc.forEach((p) => {
			if (Math.abs(p.x - cx) > width / SCALE * 0.75 || Math.abs(p.y - cy) > height / SCALE * 0.75) {
				return
			}

			p.render();
		});

		if (!skip) {
			pop();

			textSize(16)
			textAlign(LEFT, TOP)
			
			fill(255);

			for (var i = 0; i < room.state.chat.length; i++) {
				var message = room.state.chat[i]

				if (message.type != "regular") {
					fill(playerColors[5]);
				}

				text(message.line, 10, height - (room.state.chat.length - i - 1) * 20 - 60);	

				if (message.type != "regular") {
					fill(255);
				}
			}

			fill(100);
			text(`${playerArray.length} online`, 10, 10)

			if (localPlayer) {
				fill(80)
				text(`${Math.floor(localPlayer.x / 32)}:${Math.floor(localPlayer.y / 32)}`, 10, 30)
			}
		}
	}
}

var input = document.getElementById("chat");
var button = document.getElementById("send");

input.addEventListener("focusin", () => {
	room.inputBlocked = true;
});

input.addEventListener("focusout", () => {
	room.inputBlocked = false;
});

input.addEventListener("keyup", (event) => {
  if (event.keyCode === 13) {
		event.preventDefault();
		room.inputBlocked = false;
		input.blur();
    button.click();
  }
});

button.addEventListener("click", () => {
	if (room.inputBlocked || (localPlayer && localPlayer.talking)) {
		return;
	}

	if (room != undefined && /\S/.test(input.value) > 0 && input.value.length <= 256) {
		room.send("chat", input.value);
		assets["open"].play();
	}

	input.value = "";
});

function setModalEnabled(enabled) {
	room.inputBlocked = enabled;

	var o = document.getElementById("overlay");
	var c = canvas.elt;

	if (enabled) {
		o.classList.remove("hidden");
		c.classList.add("blurred");
		messsageArea.focus();
		messsageArea.value = "";
		assets["open"].play();
	} else {
		o.classList.add("hidden");
		c.classList.remove("blurred");
		assets["close"].play();
	}
}

var messsageArea = document.getElementById("message");
var leaveMessage = document.getElementById("leave");
var cancel = document.getElementById("cancel");

function ttrim() {
	if (messsageArea.value.length > 256) {
		messsageArea.value = messsageArea.value.substring(0, 256);
	}
}

messsageArea.addEventListener("input", ttrim);
messsageArea.addEventListener("change", ttrim);
messsageArea.addEventListener("paste", e => e.preventDefault());

function showTime() {
	document.getElementById("cap").classList.remove("hidden")
	
for (let i = 0; i < timeLeft; i++) {
	setTimeout(() => {
		document.getElementById("cap-time").innerHTML = Math.ceil(timeLeft);
	}, i * 1000);
}

setTimeout(() => {
	if (timeLeft <= 0) {
		document.getElementById("cap").classList.add("hidden")
	}
}, timeLeft * 1000);
}

leaveMessage.addEventListener("click", () => {
	if (!room.inputBlocked || timeLeft > 0) {
		return;
	}

	if (room != undefined && /\S/.test(messsageArea.value) && messsageArea.value.length <= 256) {
		room.send("message", messsageArea.value);
		timeLeft = 60;
		
		setCookie("timer", new Date());
		showTime()
	}

	messsageArea.value = "";
	setModalEnabled(false);
});

cancel.addEventListener("click", () => {
	if (!room.inputBlocked) {
		return;
	}

	messsageArea.value = "";
	setModalEnabled(false);
});