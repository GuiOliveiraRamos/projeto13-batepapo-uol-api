import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient
  .connect()
  .then(() => {
    db = mongoClient.db();
    console.log("rodando");
  })
  .catch((err) => console.log(err.message));

app.post("/participants", (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || name.length === 0) {
    return res.sendStatus(422);
  }
  if (req.body.includes(name)) {
    return res.sendStatus(409);
  }
  const newParticipant = { name, lastStatus: Date.now() };

  const promise = db.collection("participants").insertOne(newParticipant);

  promise.then(() =>
    res.status(201).send("Participante cadastrado com sucesso!")
  );
});

app.get("/participants", (req, res) => {
  if (participants.length === 0) {
    res.send([]);
  }
  const promise = db.collection("participants").find().toArray();
  promise.then((data) => res.send(data));
  promise.catch((err) => res.status(500).send(err.message));
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
