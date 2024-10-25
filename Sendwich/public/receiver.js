const ws = new WebSocket("ws://localhost:3000");
const joinSessionButton = document.getElementById("joinSession");
const sendMessageButton = document.getElementById("sendMessage");
const chatInput = document.getElementById("chatInput");
const chatWindow = document.getElementById("chatWindow");
const fileList = document.getElementById("fileList");
let sessionKey;

joinSessionButton.onclick = () => {
  sessionKey = document.getElementById("sessionKeyInput").value.trim();
  if (sessionKey) {
    ws.send(JSON.stringify({ type: "join-session", sessionKey }));
  }
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "session-joined") {
    displayMessage("System", "Connected to sender.");
  }

  if (data.type === "chat-message") {
    displayMessage("Sender", data.message);
  }

  if (data.type === "file-offer") {
    displayMessage("System", `Receiving file: ${data.fileName} (${data.fileSize} bytes)`);
  }

  if (data.type === "file-data") {
    const arrayBuffer = new Uint8Array(data.data);
    const blob = new Blob([arrayBuffer]);
    const url = URL.createObjectURL(blob);

    const fileItem = document.createElement("div");
    const a = document.createElement("a");
    a.href = url;
    a.download = data.fileName;
    a.textContent = `Download ${data.fileName}`;
    fileItem.appendChild(a);
    fileList.appendChild(fileItem);

    displayMessage("System", `File ${data.fileName} received!`);

    // Send confirmation to the sender
    ws.send(JSON.stringify({
      type: "file-received",
      sessionKey,
      fileName: data.fileName
    }));
  }
};

sendMessageButton.onclick = () => {
  const message = chatInput.value.trim();
  if (message) {
    displayMessage("You", message);
    ws.send(JSON.stringify({ type: "chat-message", sessionKey, message }));
    chatInput.value = "";
  }
};

function displayMessage(sender, message) {
  const messageItem = document.createElement("div");
  messageItem.textContent = `${sender}: ${message}`;
  chatWindow.appendChild(messageItem);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
