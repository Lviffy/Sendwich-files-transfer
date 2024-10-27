const ws = new WebSocket("ws://10.1.168.59:3000");
const sessionKeyInput = document.getElementById("sessionKeyInput");
const joinSessionButton = document.getElementById("joinSession");
const chatInput = document.getElementById("chatInput");
const sendMessageButton = document.getElementById("sendMessage");
const chatWindow = document.getElementById("chatWindow");
const fileInput = document.getElementById("fileInput");
const sendFileButton = document.getElementById("sendFile");

let sessionKey;

joinSessionButton.onclick = () => {
  sessionKey = sessionKeyInput.value.trim();
  if (sessionKey) {
    ws.send(JSON.stringify({ type: "join-session", sessionKey }));
  }
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "session-joined") {
    displaySystemMessage("Connected to sender!");
  }

  if (data.type === "chat-message") {
    displayMessage("Sender", data.message);
  }

  if (data.type === "file-offer") {
    displaySystemMessage(`Receiving file: ${data.fileName} (${data.fileSize} bytes)`);
  }

  if (data.type === "file-data") {
    receiveFile(data);
    displaySystemMessage("File received successfully!");
  }

  if (data.type === "error") {
    displaySystemMessage(data.message);
  }
};

// Send chat message
sendMessageButton.onclick = () => {
  const message = chatInput.value.trim();
  if (message) {
    ws.send(JSON.stringify({ type: "chat-message", message, sessionKey }));
    displayMessage("You", message);
    chatInput.value = "";
  }
};

// Display chat messages in chat window
function displayMessage(sender, message) {
  const messageElement = document.createElement("div");
  messageElement.textContent = `${sender}: ${message}`;
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to latest message
}

// Display system messages in chat window (e.g., "File received successfully!")
function displaySystemMessage(message) {
  const systemMessage = document.createElement("div");
  systemMessage.classList.add("system-message");
  systemMessage.textContent = message;
  chatWindow.appendChild(systemMessage);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to latest message
}

// Handle file receiving and downloading
function receiveFile(data) {
  const arrayBuffer = new Uint8Array(data.data);
  const blob = new Blob([arrayBuffer]);
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = data.fileName;
  downloadLink.textContent = `Download ${data.fileName}`;
  chatWindow.appendChild(downloadLink);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
