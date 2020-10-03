const fs = require('fs');

import { Room, Client } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";

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

	constructor() {
		super();

		this.x = 64;
		this.y = 64;
		this.message = null;
		this.name = "nou";
		this.color = hashCode(this.name);
		this.currentState = "idle";
	}
}

class State extends Schema {
	@type({ map: Player }) players = new MapSchema();
}

function closeEnough(dt: Array<number|string>, x: number, y: number) {
	var dx = <number> dt[0] - x;
	var dy = <number> dt[1] - y;

	return dx * dx + dy * dy <= 300 * 300;
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

			console.log(`${client.sessionId}: ${message}`);
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

			data.forEach((dt: Array<number|string>) => {
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
			var dt = [ player.x, player.y, player.name, message, hashCode(player.name) ];

			data.push(dt);

			this.clients.forEach(c => {
				player = this.state.players[client.sessionId];

				if (closeEnough(dt, player.x, player.y)) {
					c.send("add_data", dt);
				}
			});

			saveData();
		});
	}

	onJoin(client: Client) {
		var p = new Player();
		this.state.players[client.sessionId] = p;
	}

	onLeave(client: Client) {
		delete this.state.players[client.sessionId];
	}
}