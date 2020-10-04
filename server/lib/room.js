"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const colyseus_1 = require("colyseus");
const schema_1 = require("@colyseus/schema");
const Filter = require('bad-words');
const filter = new Filter();
const regex = new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?", "g");
function filterContent(str) {
    try {
        str = filter.clean(str);
    }
    catch (e) {
        console.log(e);
    }
    return str.replace(regex, "baguette");
}
const dataPath = 'data/data.json';
var data = JSON.parse(fs.readFileSync(dataPath));
var activeRoom = null;
function saveData() {
    fs.writeFileSync(dataPath, JSON.stringify(data));
}
function cleanup() {
    console.log("Cleaning up");
    if (activeRoom != null) {
        activeRoom.cleanup();
    }
    console.log("Saving data");
    saveData();
}
process.on('exit', cleanup.bind(null, { cleanup: true }));
process.on('SIGINT', cleanup.bind(null, { exit: true }));
process.on('SIGUSR1', cleanup.bind(null, { exit: true }));
process.on('SIGUSR2', cleanup.bind(null, { exit: true }));
process.on('uncaughtException', cleanup.bind(null, { exit: true }));
function hashCode(str) {
    var hash = 0;
    var chr;
    for (var i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}
class Player extends schema_1.Schema {
    constructor(name) {
        super();
        name = name.substring(0, 32);
        this.x = Math.random() * 16 - 8;
        this.y = Math.random() * 16 - 8;
        this.message = null;
        this.name = name;
        this.color = hashCode(this.name);
        this.currentState = "idle";
        this.dx = 0;
        this.dy = 0;
    }
}
__decorate([
    schema_1.type("number")
], Player.prototype, "x", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "y", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "color", void 0);
__decorate([
    schema_1.type("string")
], Player.prototype, "message", void 0);
__decorate([
    schema_1.type("string")
], Player.prototype, "name", void 0);
__decorate([
    schema_1.type("string")
], Player.prototype, "currentState", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "dx", void 0);
__decorate([
    schema_1.type("number")
], Player.prototype, "dy", void 0);
class ChatLine extends schema_1.Schema {
    constructor(line, type) {
        super();
        this.line = line;
        this.type = type;
    }
}
__decorate([
    schema_1.type("string")
], ChatLine.prototype, "line", void 0);
__decorate([
    schema_1.type("string")
], ChatLine.prototype, "type", void 0);
class State extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.players = new schema_1.MapSchema();
        this.chat = new schema_1.ArraySchema();
    }
}
__decorate([
    schema_1.type({ map: Player })
], State.prototype, "players", void 0);
__decorate([
    schema_1.type([ChatLine])
], State.prototype, "chat", void 0);
function closeEnough(dt, x, y) {
    var dx = dt[0] - x;
    var dy = dt[1] - y;
    return dx * dx + dy * dy <= 300 * 300;
}
function say(state, message, type) {
    console.log(`[${type}] ${message}`);
    state.chat.push(new ChatLine(message, type));
    if (state.chat.length > 5) {
        state.chat.splice(0, 1);
    }
    setTimeout(() => {
        for (var i = 0; i < state.chat.length; i++) {
            if (state.chat[i].line == message) {
                state.chat.splice(i, 1);
                break;
            }
        }
    }, 10000);
}
class GameRoom extends colyseus_1.Room {
    constructor() {
        super(...arguments);
        this.players = new Array();
    }
    onCreate() {
        activeRoom = this;
        this.setState(new State());
        this.onMessage("chat", (client, message) => {
            try {
                if (typeof message !== "string" || !/\S/.test(message)) {
                    return;
                }
                try {
                    message = filterContent(message);
                }
                catch (e) {
                    console.log(e);
                }
                var player = this.state.players[client.sessionId];
                player.message = message;
                say(this.state, `${player.name}: ${message}`, "regular");
            }
            catch (e) {
                console.log(e);
            }
        });
        this.onMessage("state", (client, state) => {
            try {
                var player = this.state.players[client.sessionId];
                player.currentState = state;
            }
            catch (e) {
                console.log(e);
            }
        });
        this.onMessage("fetch", (client, options) => {
            try {
                var player = this.state.players[client.sessionId];
                var d = [];
                var x = player.x;
                var y = player.y;
                data.text.forEach((dt) => {
                    if (closeEnough(dt, x, y)) {
                        d.push(dt);
                    }
                });
                if (d.length > 32) {
                    d = d.slice(d.length - 33, d.length - 1);
                }
                client.send("data", d);
            }
            catch (e) {
                console.log(e);
            }
        });
        this.onMessage("message", (client, message) => {
            try {
                if (!message || typeof message !== "string" || !/\S/.test(message) || message.length > 256) {
                    return;
                }
                try {
                    message = filterContent(message);
                }
                catch (e) {
                    console.log(e);
                }
                var player = this.state.players[client.sessionId];
                var dt = [player.x + 4, player.y + 4, player.name, message, hashCode(player.name)];
                data.text.push(dt);
                this.clients.forEach(c => {
                    player = this.state.players[client.sessionId];
                    if (closeEnough(dt, player.x + 4, player.y + 4)) {
                        c.send("add_data", dt);
                    }
                });
                saveData();
            }
            catch (e) {
                console.log(e);
            }
        });
        this.onMessage("create", (client, name) => {
            try {
                if (this.state.players[client.sessionId] || typeof name !== "string") {
                    return;
                }
                try {
                    name = filterContent(name);
                }
                catch (e) {
                    console.log(e);
                }
                var p = new Player(name);
                this.players.push(p);
                this.state.players[client.sessionId] = p;
                var position = data.positions[name];
                if (position) {
                    p.x = position[0];
                    p.y = position[1];
                }
                say(this.state, `${name} joined`, "server");
            }
            catch (e) {
                console.log(e);
            }
        });
        this.onMessage("keys", (client, state) => {
            try {
                if (typeof state[0] !== "number" || typeof state[0] !== "number") {
                    return;
                }
                var player = this.state.players[client.sessionId];
                player.dx = Math.min(1, Math.max(-1, state[0]));
                player.dy = Math.min(1, Math.max(-1, state[1]));
            }
            catch (e) {
                console.log(e);
            }
        });
        const dt = 1000 / 20;
        setInterval(() => {
            const s = dt * 0.1;
            for (var i = 0; i < this.players.length; i++) {
                var player = this.players[i];
                player.x += player.dx * s;
                player.y += player.dy * s;
            }
        }, dt);
    }
    cleanup() {
        for (var i = 0; i < this.clients.length; i++) {
            this.clients[i].send("shutdown", "server is down");
        }
    }
    onLeave(client) {
        try {
            var p = this.state.players[client.sessionId];
            data.positions[p.name] = [p.x, p.y];
            say(this.state, `${p.name} left`, "server");
            this.players.splice(this.players.indexOf(p), 1);
            delete this.state.players[client.sessionId];
        }
        catch (e) {
            console.log(e);
        }
    }
}
exports.GameRoom = GameRoom;
