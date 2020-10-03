var client = new Colyseus.Client('localhost:2567');

client.join('room').then(room => {
	console.log(room.sessionId, "joined", room.name);

	room.onStateChange((state) => {
		console.log(room.name, "has new state:", state);
	});

	room.onMessage("message_type", (message) => {
		console.log(client.id, "received on", room.name, message);
	});

	room.onError((code, message) => {
		console.log(client.id, "couldn't join", room.name);
	});

	room.onLeave((code) => {
		console.log(client.id, "left", room.name);
	});
}).catch(e => {
	console.log("JOIN ERROR", e);
});