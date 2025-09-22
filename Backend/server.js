import { WebSocketServer } from "ws";
import crypto from 'crypto';
import { Socket } from "dgram";

const wss = new WebSocketServer({port : 8080}, () =>{
    console.log("WS is ready on 8080")
})

const rooms = new Map(); //rooms contains all the room currently active

function broadcast(set , data) {
    // sets contain the client ws object for data broadcasting
    for ( const s of set ) {
        if(s.readyState === 1) {
            s.send(data);
        }
    }
}

wss.on('connection', socket => {
    socket.room = null;

    socket.on('message', buf => {
        const type = buf[0];

        const idLen = buf[1]

        const id = buf.subarray(2,2+ idLen).toString();

        if(type === 67 ) {
            // for 'C'reate

            const roomId = crypto.randomBytes(5).toString('base64url');

            const set = new Set().add(socket);
            rooms.set(roomId,set);
            socket.room = roomId;
            socket.send(roomId);
            return;
        }

        if(type === 74){
            // for 'J'oin

            const set = rooms.get(id);
            if(!set) return socket.send('E');
            set.add(socket);
            socket.room = id;
            socket.send('K');

            return;
        }

        // for timestemp broadcasting
        const set = rooms.get(socket.room);
        if(!set) return;
        broadcast(set,buf);

    })

    socket.on('close', () => {
        const set = rooms.get(socket.room);
        if(set){
            set.delete(socket);
            if(set.size===0) rooms.delete(socket.room);
        }
    })
})
