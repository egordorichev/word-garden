import { Room, Client } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";

class Player extends Schema {
	@type("number") x: number;
	@type("number") y: number;
	@type("number") color: number;
	@type("string") message: string;
	@type("string") currentState: string;

	constructor() {
		super();

		this.x = 64;
		this.y = 64;
		this.message = null;
		this.color = -1;
		this.currentState = "idle";
	}
}

class State extends Schema {
	@type({ map: Player }) players = new MapSchema();
}

export class GameRoom extends Room {
	onCreate () {
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
	}

	onJoin(client: Client) {
		var p = new Player();
		this.state.players[client.sessionId] = p;
	}

	onLeave(client: Client) {
		delete this.state.players[client.sessionId];
	}
}