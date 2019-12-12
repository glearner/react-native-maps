const express = require("express");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = 3000;

io.on("connection", socket => {
  console.log("a user connected :0");
  socket.on("chat message", message => {
    io.emit("chat message", message);
  });
});

server.listen(port, () => {
  console.log("server started at " + port);
});
