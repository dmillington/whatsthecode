const express = require("express");
const ws = require('ws');
const app = express();
const port = 8000;

var room_ids = new Map();
var clients = new Map();
var conn_id_count = 0;

const wsServer = new ws.Server({ noServer: true });
wsServer.on("connection", (socket, request) => {
  var url_split = request.url.split("/");
  var rid = url_split[url_split.length-1];

  socket.id = conn_id_count ++;
  clients.set(socket.id, {"rid": rid, "socket": socket});
  room_ids.get(rid).get("clients").set(socket.id, true);

  socket.on("message", message => {
    rid = clients.get(socket.id).rid;
    room = room_ids.get(rid);

    for (let key of room.get("clients").keys()) {
      c = clients.get(key).socket;
      if (c.readyState === ws.OPEN) {
        c.send(message);
      }
    }
  });

  socket.on("close", () => {
    rid = clients.get(socket.id).rid;
    room = room_ids.get(rid);
    room.get("clients").delete(socket.id)
    clients.delete(socket.id);

  });
});

app.set("view engine", "pug");
app.set("views", "./views");
app.use(express.static('public'));

app.get("/", (req, res) => {
  res.render("index");
});

function random_id() {
  return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
}

app.get("/new", (req, res) => {
  // random id generator yoinked from - https://gist.github.com/6174/6062387
  while (true) {
    rid = random_id()
    if (room_ids.has(rid) == false) {
      room_ids.set(rid, new Map([
        ["timestamp", Date.now()],
        ["clients", new Map()],
      ]));
      break;
    }
  }
  res.redirect("/room/" + rid)
});

app.get("/room/:rid", (req, res) => {
  var rid = req.params.rid;
  if (room_ids.has(rid) == false) {
    res.redirect("/")
    return
  }
  res.render("room");
})

const server = app.listen(port, () => {
  console.log(`whatsthecode app listening at http://localhost:${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});
