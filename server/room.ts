import { Room, Client } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";

class Player extends Schema {
	@type("number") x: number;
	@type("number") y: number;
}

class State extends Schema {
	@type("string") currentTurn: string;
	@type({ map: Player }) players = new MapSchema();
}

export class GameRoom extends Room {
	onCreate () {
		this.setState(new State());

		this.onMessage("fire", (client, message) => {
			// handle player message
		});
	}

	onJoin(client: Client) {
		this.state.players[client.sessionId] = new Player();
	}

	onLeave(client: Client) {
		delete this.state.players[client.sessionId];
	}
}