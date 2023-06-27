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

const PORT = 5000;
app.listen(PORT, `Servidor rodando na porta ${PORT}`);
