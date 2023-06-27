import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const participants = [];
const messages = [];

app.post("/participants", (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || name.length === 0) {
    return res.sendStatus(422);
  }
  if (participants.includes(name)) {
    return res.sendStatus(409);
  }
  participants.push(name);
  res.sendStatus(201);
});

app.get("/participants", (req, res) => {
  if (participants.length === 0) {
    res.send([]);
  }
});

app.post("/messages", (req, res) => {
  const from = req.headers.from;
  const { to, text, type } = req.body;

  if (!to || typeof to === "string" || to.length === 0) {
    return res.sendStatus(422);
  }
  if (!text || typeof text === "string" || text.length === 0) {
    return res.sendStatus(422);
  }
  if (type !== message || type !== private_message) {
    return res.sendStatus(422);
  }
  if (!from.includes(participants)) {
    return res.sendStatus(422);
  }
  res.sendStatus(201);
});

app.get("/messages", (req, res) => {
  const user = req.headers.user;
  const limit = parseInt(req.query.limit);
  if (isNaN(limit) || limit < 0) {
    return res.sendStatus(422);
  }
  if (!limit) {
    res.send(messages);
  }
  if (limit) {
    res.send(messages.slice(-limit));
  }
});
const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
