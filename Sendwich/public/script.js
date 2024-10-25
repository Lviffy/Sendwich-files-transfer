const fileInput = document.getElementById("fileInput");
const sendFileButton = document.getElementById("sendFile");
const status = document.getElementById("status");

const peerConnection = new RTCPeerConnection();
const ws = new WebSocket("ws://10.1.46.93:3000");

let dataChannel;

ws.onmessage = async (event) => {
  const message = JSON.parse(event.data);

  if (message.offer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    ws.send(JSON.stringify({ answer }));
  } else if (message.answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
  } else if (message.candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
  }
};

peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    ws.send(JSON.stringify({ candidate: event.candidate }));
  }
};

peerConnection.ondatachannel = (event) => {
  dataChannel = event.channel;
  dataChannel.onmessage = (event) => receiveFile(event.data);
};

sendFileButton.onclick = () => {
  const file = fileInput.files[0];
  if (file) {
    sendFile(file);
  } else {
    status.textContent = "No file selected.";
  }
};

async function sendFile(file) {
  dataChannel = peerConnection.createDataChannel("fileChannel");
  dataChannel.binaryType = "arraybuffer";

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  ws.send(JSON.stringify({ offer }));

  dataChannel.onopen = () => {
    status.textContent = "Sending file...";
    dataChannel.send(file);
  };

  dataChannel.onclose = () => {
    status.textContent = "File sent!";
  };
}

function receiveFile(data) {
  const blob = new Blob([data]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "received_file";
  document.body.appendChild(a);
  a.click();
  status.textContent = "File received!";
}
