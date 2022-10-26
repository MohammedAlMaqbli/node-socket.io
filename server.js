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
    if (i != -1) {
      users.splice(i, 1, 0);
      io.emit("updateUserStatus", { users, members });
      console.log("user disconnected");
    }
    var j = members.indexOf(socket.id);
    if (j != -1) {
      members.splice(j, 1, 0);
      io.emit("updateMemberStatus", members);
      console.log("member disconnected");
    }
  });
  //on disconnect member from socket

  socket.on("send_message", function (message) {
    console.log("Send message: ", message);

    if (users[message.receiver_id]) {
      console.log("send_message to user", message);
      io.to(`${users[message.receiver_id]}`).emit("receive_message", message);
    } else {
      if (message && message.is_sender_member == 1) {
        if (users.length > 0) {
          io.to(`${users[0]}`).emit("receive_message", message);
        } else {
          io.to(`${members[message.sender_id]}`).emit(
            "save_message_offline",
            message
          );
        }
      }
    }
  });

  socket.on("send_message-member", function (message) {
    console.log("Send message to member: ", message);
    let id =
      message.is_sender_member == 0 ? message.receiver_id : message.sender_id;

    console.log("ID ", id, members[id]);
    io.to(`${members[id]}`).emit("receive_message-member", message);
  });

  //on change seen status
  socket.on("change_seen_status", function (message) {
    console.log("change_seen_status");

    if (users[message.sender_id])
      io.to(`${users[message.receiver_id]}`).emit("seen_status", message);
  });

  socket.on("change_seen_status_member", function (message) {
    console.log("change_seen_status_member", message);
    io.to(`${members[message.receiver_id]}`).emit("seen_status", message);
  });

  socket.on("change_seen_status_member_to_user", function (message) {
    console.log("change_seen_status_member_to_user", message);
    io.to(`${users[message.receiver_id]}`).emit("seen_status", message);
  });
});

setInterval(
  () => io.emit("time", new Date().toTimeString() + " Moe All2 " + PORT),
  1000
);
