"use strict";

const express = require("express");
const socketIO = require("socket.io");
const cors = require("cors");
const PORT = process.env.PORT || 3000;
const INDEX = "/index.html";

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .use(
    cors({
      origin: "*",
    })
  )
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

const users = [];
const members = [];

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("user_connected", function (user_id) {
    users[user_id] = socket.id;
    io.emit("updateUserStatus", { users, members });
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
    console.log("Send message: ", message);
    io.to(`${users[message.receiver_id]}`).emit("receive_message", message);
  });

  socket.on("send_message-member", function (message) {
    console.log("Send message to member: ", message);

    io.to(`${members[message.receiver_id]}`).emit(
      "receive_message-member",
      message
    );
  });

  //on change seen status
  socket.on("change_seen_status", function (message) {
    console.log("Change seen status: " + users[message.receiver_id], message);
    io.to(`${users[message.receiver_id]}`).emit("seen_status", message);
  });
});

setInterval(
  () => io.emit("time", new Date().toTimeString() + " Moe All2 " + PORT),
  1000
);
