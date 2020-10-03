const fs = require('fs');

import { Room, Client } from "colyseus";
import { Schema, ArraySchema, MapSchema, type } from "@colyseus/schema";

const Filter = require('bad-words');
const filter = new Filter();

const dataPath = 'data/data.json';

var data = JSON.parse(fs.readFileSync(dataPath));

function saveData() {
	fs.writeFileSync(dataPath, JSON.stringify(data));
}

process.on('exit', saveData.bind(null, {cleanup: true}));
process.on('SIGINT', saveData.bind(null, {exit: true}));
process.on('SIGUSR1', saveData.bind(null, {exit: true}));
process.on('SIGUSR2', saveData.bind(null, {exit: true}));
process.on('uncaughtException', saveData.bind(null, {exit: true}));

function hashCode(str: string) {
	var hash = 0;
	var chr;

	for (var i = 0; i < str.length; i++) {
		chr = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0;
	}

	return hash;
}

class Player extends Schema {
	@type("number") x: number;
	@type("number") y: number;
	@type("number") color: number;
	@type("string") message: string;
	@type("string") name: string;
	@type("string") currentState: string;

	constructor(name: string) {
		super();

		name = name.substring(0, 32);

		this.x = Math.random() * 64 - 32;
		this.y = Math.random() * 64 - 32;
		this.message = null;
		this.name = name;
		this.color = hashCode(this.name);
		this.currentState = "idle";
	}
}

class ChatLine extends Schema {
	@type("string") line: string;
	@type("string") type: string;

	constructor(line: string, type: string) {
		super();

		this.line = line;
		this.type = type;
	}
}

class State extends Schema {
	@type({ map: Player }) players = new MapSchema();
	@type([ ChatLine ]) chat = new ArraySchema<ChatLine>();
}

function closeEnough(dt: Array<number|string>, x: number, y: number) {
	var dx = <number> dt[0] - x;
	var dy = <number> dt[1] - y;

	return dx * dx + dy * dy <= 300 * 300;
}

function say(state: State, message: string, type: string) {
	state.chat.push(new ChatLine(message, type));

	if (state.chat.length > 5) {
		state.chat.splice(0, 1);	
	}

	setTimeout(() => {
		for (var i = 0; i < state.chat.length; i++) {
			if(state.chat[i].line == message) {
				state.chat.splice(i, 1);
				break;
			}
		}
	}, 10000)
}

export class GameRoom extends Room {
	onCreate() {
		this.setState(new State());

		this.onMessage("move", (client, message) => {
			var player = this.state.players[client.sessionId]
			
			player.x += message.x;
			player.y += message.y;
		});

		this.onMessage("chat", (client, message) => {
			var player = this.state.players[client.sessionId]
			player.message = message;

			console.log(`${player.name}: ${message}`);
			say(this.state, `${player.name}: ${message}`, "regular");
		});

		this.onMessage("state", (client, state) => {
			var player = this.state.players[client.sessionId]
			player.currentState = state;
		});

		this.onMessage("setup", (client, options) => {
			var player = this.state.players[client.sessionId]
			player.color = options.color;
		});

		this.onMessage("fetch", (client, options) => {
			var player = this.state.players[client.sessionId]
			var d: Array<Array<number|string>> = []
			var x = player.x;
			var y = player.y;

			data.text.forEach((dt: Array<number|string>) => {
				if (closeEnough(dt, x, y)) {
					d.push(dt);
				}
			});

			client.send("data", d);
		});

		this.onMessage("message", (client, message) => {
			if (!message || message.length == 0 || message.length > 256) {
				return;
			}

			message = filter.clean(message);

			var player = this.state.players[client.sessionId];
			var dt = [ player.x + 4, player.y + 4, player.name, message, hashCode(player.name) ];

			data.text.push(dt);

			this.clients.forEach(c => {
				player = this.state.players[client.sessionId];

				if (closeEnough(dt, player.x + 4, player.y + 4)) {
					c.send("add_data", dt);
				}
			});

			saveData();
		});

		this.onMessage("create", (client, name) => {
			if (this.state.players[client.sessionId]) {
				return;
			}

			var p = new Player(name);
			this.state.players[client.sessionId] = p;

			var position = data.positions[name];

			if (position) {
				p.x = position[0];
				p.y = position[1];
			}

			say(this.state, `${name} joined`, "server");
		});
	}

	onJoin(client: Client) {
		
	}

	onLeave(client: Client) {
		var p = this.state.players[client.sessionId];
		data.positions[p.name] = [ p.x, p.y ];
		say(this.state, `${p.name} left`, "server");

		delete this.state.players[client.sessionId];
	}
}