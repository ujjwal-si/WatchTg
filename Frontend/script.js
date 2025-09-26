let ws;
let isInRoom = false;
let role = ''

function wsConnect(onOpenCallback) {
    if (ws) return;
    ws = new WebSocket('ws://localhost:8080');
    // ws = new WebSocket('ws://20.244.29.96:8080');
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
        logMessage("Server Connected !!");
        onOpenCallback && onOpenCallback();
    };

    ws.onmessage = (e) => {
        let msg = typeof e.data === "string"
            ? e.data
            : new TextDecoder().decode(e.data);

        if (isInRoom) {
            logMessage("Chat: " + msg);
            syncVideo(msg);
        }
        else if (msg === 'K') {
            logMessage("Joined room ✅");
            role = 'slave'
            isInRoom = true;
        }
        else if (msg.length === 8) {
            logMessage("Room created ✅ with Code : " + msg);
            role = 'master'
            isInRoom = true;
        }
        else if (msg === 'E') {
            logMessage("Error : no such room OR you are using ' | ' or ' ` ' at start of chat ");
        }
    };

    ws.onclose = () => {
        logMessage("Disconnected ⛔");
        ws = null;
        isInRoom = false;
    };
}

function createRoom() {
    wsConnect(() => {
        logMessage("Trying Creating a Room !!");
        ws.send(Uint8Array.of(124)); 
    });
}

function joinRoom() {
    wsConnect(() => {
        logMessage("Trying Join the Room !!");
        const code = document.getElementById('code').value;
        if (!code) return alert(" ⚠️ Enter room code before join");
        const enc = new TextEncoder();
        ws.send(Uint8Array.of(96, ...enc.encode(code)));
    });
}

function sendCmd(msg) {
    if (!msg || !ws) return;
    const enc = new TextEncoder();
    ws.send(enc.encode(msg));
    logMessage('You: ' + msg);
}



function logMessage(msg) {
    const div = document.getElementById('messages');
    div.innerHTML += msg + '<br>';
    div.scrollTop = div.scrollHeight;
}

function loadVideo(input) {
    if(!isInRoom){
        const errorTextElement = document.getElementById("errorText");
        const inputElement = document.getElementById("videoFile");
        errorTextElement.innerHTML = "Please Join or Create a Room 🤦‍♂️";
        setTimeout(() => errorTextElement.textContent = "", 4000);
        inputElement.value="";
        return;
    }
    const file = input.files[0];
    const videoElement = document.getElementById("video");
    videoElement.src = (window.URL || window.webkitURL).createObjectURL(file);

    if(role==='master'){
        videoElement.onplay = () => {
            sendCmd('pl');
        } 
        videoElement.onpause = () => {
            sendCmd('pa');
        } 
        videoElement.onseeked = () => {
            sendCmd(videoElement.currentTime);
        } 
    }
}

function syncVideo(cmd){
    const videoElement = document.getElementById("video");
    
    if(cmd === 'pl'){
        videoElement.play();
    } else if (cmd === 'pa'){
        videoElement.pause();
    } else {
        videoElement.currentTime = Number(cmd);
    }
}