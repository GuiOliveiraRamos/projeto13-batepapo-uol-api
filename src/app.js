import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import Joi from "joi";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();
dayjs().format();

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient
  .connect()
  .then(() => {
    db = mongoClient.db();
    console.log("rodando");
  })
  .catch((err) => console.log(err.message));

app.post("/participants", async (req, res) => {
  const { name } = req.body;
  const { error } = Joi.object({
    name: Joi.string().required().min(1),
  }).validate(req.body);

  if (error) {
    return res.sendStatus(422);
  }

  const participants = await db.collection("participants").findOne({ name });

  if (participants) {
    return res.sendStatus(409);
  }
  const newParticipant = { name, lastStatus: Date.now() };

  const promise = db.collection("participants").insertOne(newParticipant);

  promise.then(() => {
    const loginMessage = {
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss"),
    };

    db.collection("messages").insertOne(loginMessage);

    res.sendStatus(201);
  });
});

app.get("/participants", (req, res) => {
  const promise = db.collection("participants").find().toArray();
  promise.then((data) => res.send(data));
  promise.catch((err) => res.status(500).send(err.message));
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;

  const from = req.headers.User;

  const { error } = Joi.object({
    to: Joi.string().required().min(1),
    text: Joi.string().required().min(1),
    type: Joi.string().valid("message", "private_message").required(),
  }).validate({ to, text, type });

  if (error) {
    return res.status(422).send("erro ao enviar mensagem");
  }

  const newMessage = { from, to, text, type, time: dayjs().format("HH:mm:ss") };
  const promise = db.collection("messages").insertOne(newMessage);

  promise.then(() => res.status(201).send("Mensagem enviada!"));
  promise.catch((err) => res.status(422).send(err.message));
});

app.get("/messages", (req, res) => {
  //  const user = req.headers.user;
  //const limit = parseInt(req.query.limit);
  //if (isNaN(limit) || limit < 0) {
  //  return res.sendStatus(422);
  //}
  //  if (!limit) {
  //    res.send(messages);
  //  }
  //  if (limit) {
  //    res.send(messages.slice(-limit));
  //  }
  const promise = db.collection("messages").find().toArray();
  promise.then((data) => res.send(data));
  promise.catch((err) => res.status(500).send(err.message));
});
const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
