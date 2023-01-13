const WebSocket = require("ws");
const server = new WebSocket.Server({port: 3000});

server.on("connection", socket => {
    console.log("CLIENT CONNECTED")

    socket.on("message", req => {
        console.log(req.toString());
    });

    socket.on("close", _ => {
        console.log("CLIENT DISCONNECTED")
    })

});