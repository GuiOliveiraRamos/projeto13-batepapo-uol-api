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
    name: Joi.string().required(),
  }).validate(req.body, { abortEarly: false });

  try {
    if (error) {
      return res.sendStatus(422);
    }

    const participants = await db.collection("participants").findOne({ name });

    if (participants) {
      return res.sendStatus(409);
    }
    const newParticipant = { name, lastStatus: Date.now() };

    await db.collection("participants").insertOne(newParticipant);

    const loginMessage = {
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss"),
    };

    db.collection("messages").insertOne(loginMessage);

    res.sendStatus(201);
  } catch (err) {
    res.status(422).send(err.message);
  }
});

app.get("/participants", (req, res) => {
  const promise = db.collection("participants").find().toArray();
  promise.then((data) => res.send(data));
  promise.catch((err) => res.status(500).send(err.message));
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;

  const from = req.headers.user;

  const { error } = Joi.object({
    to: Joi.string().required().min(1),
    text: Joi.string().required().min(1),
    type: Joi.string().valid("message", "private_message").required(),
  }).validate({ to, text, type });

  try {
    if (error) {
      return res.status(422).send("erro ao enviar mensagem");
    }

    const participant = await db
      .collection("participants")
      .findOne({ name: from });

    if (!participant) {
      return res.status(422).send("Não está cadastrado");
    }

    const newMessage = {
      from,
      to,
      text,
      type,
      time: dayjs().format("HH:mm:ss"),
    };
    await db.collection("messages").insertOne(newMessage);

    res.status(201).send("Mensagem enviada!");
  } catch (err) {
    res.status(422).send(err.message);
  }
});

app.get("/messages", async (req, res) => {
  const user = req.headers.user;

  const { limit } = req.query;

  const limitParams = parseInt(limit);

  const filter = {
    $or: [{ to: "Todos" }, { to: user }, { from: user }, { type: "message" }],
  };

  try {
    if (limit) {
      if (limitParams === 0 || limitParams < 0 || isNaN(limitParams)) {
        return res.sendStatus(422);
      }
    }
    if (!limit) {
      await db
        .collection("messages")
        .find(filter)
        .toArray()
        .then((data) => res.send(data));
    } else {
      await db
        .collection("messages")
        .find(filter)
        .toArray()
        .then((data) => res.send(data.slice(-limit)));
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/status", async (req, res) => {
  const user = req.headers.user;

  try {
    const participant = await db
      .collection("participants")
      .findOne({ name: user });

    if (!participant) {
      return res.sendStatus(404);
    }

    await db
      .collection("participants")
      .updateOne({ name: user }, { $set: { lastStatus: Date.now() } });

    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const removeInactiveParticipants = async () => {
  const timeLimit = Date.now() - 10000;

  try {
    const inactiveParticipants = await db
      .collection("participants")
      .find({ lastStatus: { $lt: timeLimit } })
      .toArray();

    const inactiveParticipantNames = inactiveParticipants.map(
      (participant) => participant.name
    );

    await db.collection("participants").deleteMany({
      name: { $in: inactiveParticipantNames },
    });

    inactiveParticipantNames.forEach(async (name) => {
      const logoutMessage = {
        from: name,
        to: "Todos",
        text: "sai da sala...",
        type: "status",
        time: dayjs().format("HH:mm:ss"),
      };

      await db.collection("messages").insertOne(logoutMessage);
    });
  } catch (error) {
    console.log(error);
  }
};

setInterval(removeInactiveParticipants, 15000);

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
