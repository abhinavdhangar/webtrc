const express = require("express");
const app = express();
const server = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: ["https://vgint7-3000.preview.csb.app"],
    credentials: true,
  },
});
const port = process.env.PORT || 3004;
let connectedUsers = [];

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

io.on("connection", (socket) => {
  console.log("A user connected");

  connectedUsers.push(socket.id);
  io.emit("update-users", connectedUsers);
  socket.on("disconnect", () => {
    console.log("A user disconnected");
    connectedUsers = connectedUsers.filter((user) => user !== socket.id);
    io.emit("update-users", connectedUsers);
  });

  socket.on("offer", (offer, candidate, toId) => {
    socket.to(toId).emit("offer", { offer, candidate, id: socket.id });
  });

  socket.on("answer", (answer, candidate, toId) => {
    console.log("its answer");
    socket.to(toId).emit("answer", { answer, candidate });
  });

  socket.on("candidate", (candidate, toId) => {
    socket.to(toId).emit("candidate", candidate);
  });
});
