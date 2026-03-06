const express = require("express");
const path = require("path");
const { User } = require("./models");
const app = express();
const PORT = 8080;

app.use(express.json());

const feedbacks = [];

app.get('/', (req, res) => {
  res.json({ message: 'Добро пожаловать в моё приложение FastAPI!' });
});

app.get("/html", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/calculate", (req, res) => {
  const { num1, num2 } = req.body;

  if (typeof num1 !== "number" || typeof num2 !== "number") {
    return res.status(400).json({ error: "num1 и num2 должны быть числами" });
  }

  const result = num1 + num2;
  res.json({ result });
});

const user = new User("Tsukanov Maksim", 1);

app.get("/users", (req, res) => {
  res.json(user);
});

app.post("/user", (req, res) => {
  const { name, age } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Поле 'name' обязательно и должно быть строкой" });
  }

  if (typeof age !== "number" || age < 0) {
    return res.status(400).json({ error: "Поле 'age' должно быть положительным числом" });
  }

  const is_adult = age >= 18;

  res.json({
    name,
    age,
    is_adult
  });
});

app.post("/feedback", (req, res) => {
  const { name, message } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Поле 'name' обязательно и должно быть строкой" });
  }

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Поле 'message' обязательно и должно быть строкой" });
  }

  if (name.length < 2 || name.length > 50) {
    return res.status(422).json({
      detail: [{
        type: "string_length_error",
        loc: ["body", "name"],
        msg: "String should have at least 2 characters",
        input: name,
        ctx: {
          min_length: 2
        }
      }]
    });
  }

  if (message.length < 10 || message.length > 500) {
    return res.status(422).json({
      detail: [{
        type: "string_length_error",
        loc: ["body", "message"],
        msg: "String should have at least 10 characters",
        input: message,
        ctx: {
          min_length: 10
        }
      }]
    });
  }

  const forbiddenWords = ["кринж", "рофл", "вайб"];
  const messageLower = message.toLowerCase();

  for (const word of forbiddenWords) {
    if (messageLower.includes(word)) {
      return res.status(422).json({
        detail: [{
          type: "value_error",
          loc: ["body", "message"],
          msg: "Value error, Использование недопустимых слов",
          input: message,
          ctx: { error: {} }
        }]
      });
    }
  }

  const feedback = { name, message, timestamp: new Date().toISOString() };
  feedbacks.push(feedback);

  res.json({
    message: `Спасибо, ${name}! Ваш отзыв сохранён.`
  });
});

app.get("/feedbacks", (req, res) => {
  res.json({
    count: feedbacks.length,
    feedbacks
  });
});

app.get("/about", (req, res) => {
  res.json({ message: "About us" });
});

app.get("/home", (req, res) => {
  res.json({ message: "home" });
});

app.get("/contact", (req, res) => {
  res.json({ message: "contacts" });
});

const todos = [
  { id: 1, text: "" },
  { id: 2, text: "" },
];

app.post("/todos", (req, res) => {
  const text = req.body.text;
  const newTodo = { id: todos.length + 1, text: text };
  todos.push(newTodo);
  res.json(newTodo);
});

app.delete("/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Не найдено" });
  }

  todos.splice(index, 1);
  res.json({ message: "Удалено" });
});

app.get("/todos", (req, res) => {
  res.json({ todos });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
