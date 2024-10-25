const ws = new WebSocket("ws://localhost:3000");
const createSessionButton = document.getElementById("createSession");
const sessionInfo = document.getElementById("sessionInfo");
const sessionKeyDisplay = document.getElementById("sessionKey");
const copySessionKeyButton = document.getElementById("copySessionKey");
const fileInput = document.getElementById("fileInput");
const sendFileButton = document.getElementById("sendFile");
const status = document.getElementById("status");
const chatInput = document.getElementById("chatInput");
const sendMessageButton = document.getElementById("sendMessage");
const chatWindow = document.getElementById("chatWindow");

let sessionKey;

// Create a new session and hide the button
createSessionButton.onclick = () => {
  ws.send(JSON.stringify({ type: "create-session" }));
  createSessionButton.style.display = "none"; // Hide the button
};

// Handle WebSocket messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "session-created") {
    sessionKey = data.sessionKey;
    sessionKeyDisplay.textContent = `Session Key: ${sessionKey}`;
    sessionInfo.style.display = "block"; // Show session key and copy button
  }

  if (data.type === "receiver-joined") {
    status.textContent = "Receiver connected!";
  }

  if (data.type === "chat-message") {
    displayMessage("Receiver", data.message);
  }

  if (data.type === "file-received") {
    status.textContent = "File sent successfully!";
  }
};

// Copy session key to clipboard
copySessionKeyButton.onclick = () => {
  navigator.clipboard.writeText(sessionKey).then(() => {
    alert("Session Key copied!");
  }).catch(() => {
    alert("Failed to copy session key.");
  });
};

// Send a chat message
sendMessageButton.onclick = () => {
  const message = chatInput.value.trim();
  if (message) {
    ws.send(JSON.stringify({ type: "chat-message", message, sessionKey }));
    displayMessage("You", message);
    chatInput.value = "";
  }
};

// Display chat messages in the chat window
function displayMessage(sender, message) {
  const messageElement = document.createElement("div");
  messageElement.textContent = `${sender}: ${message}`;
  chatWindow.appendChild(messageElement);
}

// Send a file
sendFileButton.onclick = () => {
  if (fileInput.files.length === 0) {
    status.textContent = "Please select a file.";
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    ws.send(JSON.stringify({
      type: "file-offer",
      sessionKey,
      fileName: file.name,
      fileSize: file.size,
    }));

    ws.send(JSON.stringify({
      type: "file-data",
      sessionKey,
      fileName: file.name,
      data: Array.from(new Uint8Array(reader.result)),
    }));

    status.textContent = "Sending file...";
  };

  reader.readAsArrayBuffer(file);
};
