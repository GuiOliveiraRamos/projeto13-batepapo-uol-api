import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const participants = [];

app.post("/participants", (req, res) => {
  const { name } = req.body;
  if (!name) {
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

  if (!to && !text) {
    return res.sendStatus(422);
  }
  if (type !== message || type !== private_message) {
    return res.sendStatus(422);
  }
  if (!from.includes(participants)) {
    res.sendStatus(422);
  }
  res.sendStatus(201);
});

const PORT = 5000;
app.listen(PORT, `Servidor rodando na porta ${PORT}`);
