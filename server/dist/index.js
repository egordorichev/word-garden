"use strict";
exports.__esModule = true;
var HOST = "localhost";
var http_1 = require("http");
var express_1 = require("express");
var cors_1 = require("cors");
var colyseus_1 = require("colyseus");
var monitor_1 = require("@colyseus/monitor");
var room_1 = require("./room");
var port = Number(process.env.PORT || 2567);
var app = express_1["default"]();
app.use(cors_1["default"]());
app.use(express_1["default"].json());
var server = http_1["default"].createServer(app);
var gameServer = new colyseus_1.Server({
    server: server
});
gameServer.define('room', room_1.GameRoom);
app.use("/colyseus", monitor_1.monitor());
gameServer.listen(port);
console.log("Listening on ws://" + HOST + ":" + port);
