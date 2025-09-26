import { WebSocketServer } from "ws";
import crypto from 'crypto';

const wss = new WebSocketServer({port: 8080}, () => {
    console.log("WS ready on 8080");
});

const rooms = new Map();

wss.on('connection', socket => {
    socket.room = null;
    socket.creator= false;

    socket.on('message', buf => {
        const type = buf[0];

        // | (pipe, ASCII code 124) → CREATE
        if(type === 124) {
            const roomId = crypto.randomBytes(6).toString('base64url');
            const set = new Set([socket]);
            rooms.set(roomId, set);
            socket.room = roomId;
            socket.creator= true;
            socket.send(roomId);
            return;
        }

        // ` (backtick, ASCII code 96) → JOIN
        if(type === 96) {
            const roomId = buf.subarray(1).toString();
            const set = rooms.get(roomId);
            
            if(!set) return socket.send('E');
            
            set.add(socket);
            socket.room = roomId;
            socket.send('K');
            return;
        }

        // BROADCAST to room
        if(socket.creator){
            const set = rooms.get(socket.room);
            if(!set) return
            
            for(const s of set) {
                if(s !== socket && s.readyState === 1) {
                    s.send(buf);
                }
            }
        }
        
        
    });

    socket.on('close', () => {
        const set = rooms.get(socket.room);
        if(set) {
            set.delete(socket);
            if(set.size === 0) rooms.delete(socket.room);
        }
    });
});

