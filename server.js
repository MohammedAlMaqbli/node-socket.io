"use strict";

const express = require("express");
const socketIO = require("socket.io");

const PORT = process.env.PORT || 3000;
const INDEX = "/index.html";

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

const users = [];
const members = [];

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("user_connected", function (user_id) {
    users[user_id] = socket.id;
    io.emit("updateUserStatus", users);
    console.log("user connected " + user_id);
  });

  socket.on("member_connected", function (user_id) {
    members[user_id] = socket.id;
    io.emit("updateMemberStatus", members);
    console.log("member connected " + user_id);
  });

  socket.on("disconnect", function () {
    var i = users.indexOf(socket.id);
    users.splice(i, 1, 0);
    io.emit("updateUserStatus", users);
  });

  socket.on("send_message", function (message) {
    io.to(`${users[message.receiver_id]}`).emit("receive_message", message);
  });

  socket.on("send_message-member", function (message) {
    io.to(`${members[message.receiver_id]}`).emit(
      "receive_message-member",
      message
    );
  });
});

setInterval(
  () => io.emit("time", new Date().toTimeString() + " Moe " + PORT),
  1000
);
