"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var fs = require('fs');
var colyseus_1 = require("colyseus");
var schema_1 = require("@colyseus/schema");
var Filter = require('bad-words');
var filter = new Filter();
var regex = new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?", "g");
function filterContent(str) {
    try {
        str = filter.clean(str);
    }
    catch (e) {
        console.log(e);
    }
    return str.replace(regex, "baguette");
}
var dataPath = 'data/data.json';
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
var Player = /** @class */ (function (_super) {
    __extends(Player, _super);
    function Player(name) {
        var _this = _super.call(this) || this;
        name = name.substring(0, 32);
        _this.x = Math.random() * 16 - 8;
        _this.y = Math.random() * 16 - 8;
        _this.message = null;
        _this.name = name;
        _this.color = hashCode(_this.name);
        _this.currentState = "idle";
        _this.dx = 0;
        _this.dy = 0;
        return _this;
    }
    __decorate([
        schema_1.type("number")
    ], Player.prototype, "x");
    __decorate([
        schema_1.type("number")
    ], Player.prototype, "y");
    __decorate([
        schema_1.type("number")
    ], Player.prototype, "color");
    __decorate([
        schema_1.type("string")
    ], Player.prototype, "message");
    __decorate([
        schema_1.type("string")
    ], Player.prototype, "name");
    __decorate([
        schema_1.type("string")
    ], Player.prototype, "currentState");
    __decorate([
        schema_1.type("number")
    ], Player.prototype, "dx");
    __decorate([
        schema_1.type("number")
    ], Player.prototype, "dy");
    return Player;
}(schema_1.Schema));
var ChatLine = /** @class */ (function (_super) {
    __extends(ChatLine, _super);
    function ChatLine(line, type) {
        var _this = _super.call(this) || this;
        _this.line = line;
        _this.type = type;
        return _this;
    }
    __decorate([
        schema_1.type("string")
    ], ChatLine.prototype, "line");
    __decorate([
        schema_1.type("string")
    ], ChatLine.prototype, "type");
    return ChatLine;
}(schema_1.Schema));
var State = /** @class */ (function (_super) {
    __extends(State, _super);
    function State() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.players = new schema_1.MapSchema();
        _this.chat = new schema_1.ArraySchema();
        return _this;
    }
    __decorate([
        schema_1.type({ map: Player })
    ], State.prototype, "players");
    __decorate([
        schema_1.type([ChatLine])
    ], State.prototype, "chat");
    return State;
}(schema_1.Schema));
function closeEnough(dt, x, y) {
    var dx = dt[0] - x;
    var dy = dt[1] - y;
    return dx * dx + dy * dy <= 300 * 300;
}
function say(state, message, type) {
    console.log("[" + type + "] " + message);
    state.chat.push(new ChatLine(message, type));
    if (state.chat.length > 5) {
        state.chat.splice(0, 1);
    }
    setTimeout(function () {
        for (var i = 0; i < state.chat.length; i++) {
            if (state.chat[i].line == message) {
                state.chat.splice(i, 1);
                break;
            }
        }
    }, 10000);
}
var GameRoom = /** @class */ (function (_super) {
    __extends(GameRoom, _super);
    function GameRoom() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.players = new Array();
        return _this;
    }
    GameRoom.prototype.onCreate = function () {
        var _this = this;
        activeRoom = this;
        this.setState(new State());
        this.onMessage("chat", function (client, message) {
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
                var player = _this.state.players[client.sessionId];
                player.message = message;
                say(_this.state, player.name + ": " + message, "regular");
            }
            catch (e) {
                console.log(e);
            }
        });
        this.onMessage("state", function (client, state) {
            try {
                var player = _this.state.players[client.sessionId];
                player.currentState = state;
            }
            catch (e) {
                console.log(e);
            }
        });
        this.onMessage("fetch", function (client, options) {
            try {
                var player = _this.state.players[client.sessionId];
                var d = [];
                var x = player.x;
                var y = player.y;
                data.text.forEach(function (dt) {
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
        this.onMessage("message", function (client, message) {
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
                var player = _this.state.players[client.sessionId];
                var dt = [player.x + 4, player.y + 4, player.name, message, hashCode(player.name)];
                data.text.push(dt);
                _this.clients.forEach(function (c) {
                    player = _this.state.players[client.sessionId];
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
        this.onMessage("create", function (client, name) {
            try {
                if (_this.state.players[client.sessionId] || typeof name !== "string") {
                    return;
                }
                try {
                    name = filterContent(name);
                }
                catch (e) {
                    console.log(e);
                }
                var p = new Player(name);
                _this.players.push(p);
                _this.state.players[client.sessionId] = p;
                var position = data.positions[name];
                if (position) {
                    p.x = position[0];
                    p.y = position[1];
                }
                say(_this.state, name + " joined", "server");
            }
            catch (e) {
                console.log(e);
            }
        });
        this.onMessage("keys", function (client, state) {
            try {
                if (typeof state[0] !== "number" || typeof state[0] !== "number") {
                    return;
                }
                var player = _this.state.players[client.sessionId];
                player.dx = Math.min(1, Math.max(-1, state[0]));
                player.dy = Math.min(1, Math.max(-1, state[1]));
            }
            catch (e) {
                console.log(e);
            }
        });
        var dt = 1000 / 20;
        setInterval(function () {
            var s = dt * 0.1;
            for (var i = 0; i < _this.players.length; i++) {
                var player = _this.players[i];
                player.x += player.dx * s;
                player.y += player.dy * s;
            }
        }, dt);
    };
    GameRoom.prototype.cleanup = function () {
        for (var i = 0; i < this.clients.length; i++) {
            this.clients[i].send("shutdown", "server is down");
        }
    };
    GameRoom.prototype.onLeave = function (client) {
        try {
            var p = this.state.players[client.sessionId];
            data.positions[p.name] = [p.x, p.y];
            say(this.state, p.name + " left", "server");
            this.players.splice(this.players.indexOf(p), 1);
            delete this.state.players[client.sessionId];
        }
        catch (e) {
            console.log(e);
        }
    };
    return GameRoom;
}(colyseus_1.Room));
exports.GameRoom = GameRoom;
