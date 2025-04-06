
const app_id = 'app_id'; // Replace with your app_id.
const socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`); // Create a new WebSocket connection using the app_id

// Event handler for when the WebSocket connection is opened
socket.onopen = function (e) {
  console.log('[open] Connection established'); // Log connection establishment
  console.log('Sending to server');

  const sendMessage = JSON.stringify({ ping: 1 }); // Create a ping message in JSON format
  socket.send(sendMessage); // Send the ping message to the server
};

// Event handler for when a message is received from the server
socket.onmessage = function (event) {
  console.log(`[message] Data received from server: ${event.data}`); // Log the message received from the server
};

// Event handler for when the WebSocket connection is closed
socket.onclose = function (event) {
  if (event.wasClean) {
    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`); // Log clean close with code and reason
  } else {
    console.log('[close] Connection died'); // Log an abrupt close
  }
};

// Event handler for when an error occurs with the WebSocket connection
socket.onerror = function (error) {
  console.log(`[error] ${error.message}`); // Log the error that occurred
};

