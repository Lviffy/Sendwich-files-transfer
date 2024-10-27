const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));
app.use(cors({origin: 'http://10.1.168.59:3000'}));

const sessions = {};

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "create-session") {
      const sessionKey = crypto.randomBytes(4).toString("hex");
      sessions[sessionKey] = { sender: ws, receiver: null };
      ws.send(JSON.stringify({ type: "session-created", sessionKey }));
    }

    if (data.type === "join-session") {
      const session = sessions[data.sessionKey];
      if (session && !session.receiver) {
        session.receiver = ws;
        session.sender.send(JSON.stringify({ type: "receiver-joined" }));
        ws.send(JSON.stringify({ type: "session-joined", sessionKey: data.sessionKey }));
      } else {
        ws.send(JSON.stringify({ type: "error", message: "Invalid or full session key" }));
      }
    }

    if (data.type === "chat-message" && sessions[data.sessionKey]) {
      const session = sessions[data.sessionKey];
      const target = ws === session.sender ? session.receiver : session.sender;
      target.send(JSON.stringify({ type: "chat-message", message: data.message }));
    }

    if (data.type === "file-offer" && sessions[data.sessionKey]) {
      const session = sessions[data.sessionKey];
      session.receiver.send(JSON.stringify(data));
    }

    if (data.type === "file-data" && sessions[data.sessionKey]) {
      const session = sessions[data.sessionKey];
      session.receiver.send(JSON.stringify(data));
    }

    if (data.type === "file-received" && sessions[data.sessionKey]) {
      const session = sessions[data.sessionKey];
      session.sender.send(JSON.stringify({ type: "file-received", fileName: data.fileName }));
    }
  });

  ws.on("close", () => {
    for (const [key, session] of Object.entries(sessions)) {
      if (session.sender === ws || session.receiver === ws) {
        delete sessions[key];
        break;
      }
    }
  });
});
const host = "10.1.168.59" 
server.listen(3000,host, () => {
  console.log("Server running at http://10.1.168.59:3000");
});
