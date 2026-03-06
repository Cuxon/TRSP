const express = require("express");
const path = require("path");
const { User } = require("./models"); // Импорт модели для задания 1.4
const app = express();
const PORT = 8080;

// Middleware для парсинга JSON
app.use(express.json());

// Хранилище для отзывов (Задание 2.1 и 2.2)
const feedbacks = [];

// ==================== ЗАДАНИЕ 1.1 ====================
// ИСПРАВЛЕНО: было /hi, нужен корневой маршрут /
app.get('/', (req, res) => {
  res.json({ message: 'Добро пожаловать в моё приложение FastAPI!' });
});

// ==================== ЗАДАНИЕ 1.2 ====================
// Возврат HTML-страницы (добавлено)
app.get("/html", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ==================== ЗАДАНИЕ 1.3 ====================
// ИСПРАВЛЕНО: было GET, нужен POST с телом запроса
app.post("/calculate", (req, res) => {
  const { num1, num2 } = req.body;
  
  // Валидация входных данных
  if (typeof num1 !== "number" || typeof num2 !== "number") {
    return res.status(400).json({ error: "num1 и num2 должны быть числами" });
  }
  
  const result = num1 + num2;
  res.json({ result });
});

// ==================== ЗАДАНИЕ 1.4 ====================
// Создание экземпляра пользователя из модели
const user = new User("Tsukanov Maksim", 1);

app.get("/users", (req, res) => {
  res.json(user);
});

// ==================== ЗАДАНИЕ 1.5 ====================
// POST-запрос для проверки возраста пользователя (добавлено)
app.post("/user", (req, res) => {
  const { name, age } = req.body;
  
  // Валидация данных
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Поле 'name' обязательно и должно быть строкой" });
  }
  
  if (typeof age !== "number" || age < 0) {
    return res.status(400).json({ error: "Поле 'age' должно быть положительным числом" });
  }
  
  // Проверка на совершеннолетие
  const is_adult = age >= 18;
  
  res.json({
    name,
    age,
    is_adult
  });
});

// ==================== ЗАДАНИЕ 2.1 и 2.2 ====================
// POST-запрос для отправки отзыва с валидацией
app.post("/feedback", (req, res) => {
  const { name, message } = req.body;
  
  // Базовая валидация
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Поле 'name' обязательно и должно быть строкой" });
  }
  
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Поле 'message' обязательно и должно быть строкой" });
  }
  
  // Валидация длины (Задание 2.2)
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
  
  // Проверка на недопустимые слова (Задание 2.2)
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
  
  // Сохранение отзыва
  const feedback = { name, message, timestamp: new Date().toISOString() };
  feedbacks.push(feedback);
  
  // Ответ
  res.json({
    message: `Спасибо, ${name}! Ваш отзыв сохранён.`
  });
});

// Дополнительный маршрут для просмотра всех отзывов
app.get("/feedbacks", (req, res) => {
  res.json({
    count: feedbacks.length,
    feedbacks
  });
});

// ==================== ТВОИ ДОПОЛНИТЕЛЬНЫЕ МАРШРУТЫ ====================
app.get("/about", (req, res) => {
  res.json({ message: "About us" });
});

app.get("/home", (req, res) => {
  res.json({ message: "home" });
});

app.get("/contact", (req, res) => {
  res.json({ message: "contacts" });
});

// Todos (твой код)
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

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`\n📝 Доступные маршруты для контрольной работы:`);
  console.log(`   GET  /           - Приветствие (Задание 1.1)`);
  console.log(`   GET  /html       - HTML страница (Задание 1.2)`);
  console.log(`   POST /calculate  - Сумма чисел (Задание 1.3)`);
  console.log(`   GET  /users      - Информация о пользователе (Задание 1.4)`);
  console.log(`   POST /user       - Проверка возраста (Задание 1.5)`);
  console.log(`   POST /feedback   - Отправка отзыва (Задание 2.1, 2.2)`);
  console.log(`   GET  /feedbacks  - Просмотр всех отзывов\n`);
});
