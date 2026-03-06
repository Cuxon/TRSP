# Контрольная работа №1 - Express.js (вместо FastAPI)

Выполнил: **Tsukanov Maksim**

> 💡 **Примечание:** Все задания из Python FastAPI адаптированы под Node.js + Express.js

---

## 📦 Установка

```bash
npm install
```

## 🚀 Запуск

### Обычный режим:
```bash
npm start
```

### Режим разработки (с автоперезагрузкой):
```bash
npm run dev
```

Сервер запустится на `http://localhost:8080`

---

## 📂 Структура проекта

```
.
├── app.js          # Основной файл приложения (аналог app.py)
├── models.js       # Модели данных (аналог models.py с Pydantic)
├── index.html      # HTML-страница для задания 1.2
├── package.json    # Зависимости проекта
├── test_requests.sh # Скрипт для тестирования
└── README.md       # Документация
```

---

## ✅ Выполненные задания

### 🌟 Задание 1.1 - Приветственное сообщение

**Эндпоинт:** `GET /`

**Описание:** Возвращает JSON с приветствием (корневой URL)

**Пример запроса:**
```bash
curl http://localhost:8080/
```

**Ответ:**
```json
{
  "message": "Добро пожаловать в моё приложение FastAPI!"
}
```

**Что исправлено:**
- ✅ Изменён маршрут с `/hi` на `/` (корневой URL)

---

### 🌟 Задание 1.2 - HTML страница

**Эндпоинт:** `GET /html`

**Описание:** Возвращает HTML-страницу из файла `index.html` (аналог FileResponse в FastAPI)

**Содержимое index.html:**
```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Пример простой страницы html</title>
</head>
<body>
    Я ОБОЖАЮ ВСТАВАТЬ К ПЕРВОЙ ПАРЕ :)
</body>
</html>
```

**Пример:**
Откройте в браузере: `http://localhost:8080/html`

---

### 🌟 Задание 1.3* - Калькулятор (сумма двух чисел)

**Эндпоинт:** `POST /calculate`

**Описание:** Принимает два числа и возвращает их сумму

**Что исправлено:**
- ✅ Изменён метод с `GET` на `POST`
- ✅ Числа теперь приходят в теле запроса (body), а не жёстко заданы в коде

**Пример запроса:**
```bash
curl -X POST http://localhost:8080/calculate \
  -H "Content-Type: application/json" \
  -d '{"num1": 5, "num2": 10}'
```

**Ответ:**
```json
{
  "result": 15
}
```

---

### 🌟 Задание 1.4 - Информация о пользователе

**Файлы:** `models.js` + `app.js`

**Эндпоинт:** `GET /users`

**Описание:** Возвращает данные пользователя из модели User

**Что добавлено:**
- ✅ Создан файл `models.js` с классом `User` (аналог Pydantic модели)
- ✅ В `app.js` импортируется модель и создаётся экземпляр

**models.js:**
```javascript
class User {
  constructor(name, id) {
    this.name = name;
    this.id = id;
  }
}
module.exports = { User };
```

**app.js:**
```javascript
const { User } = require("./models");
const user = new User("Tsukanov Maksim", 1);
```

**Пример запроса:**
```bash
curl http://localhost:8080/users
```

**Ответ:**
```json
{
  "name": "Tsukanov Maksim",
  "id": 1
}
```

---

### 🌟 Задание 1.5* - Проверка возраста (совершеннолетие)

**Эндпоинт:** `POST /user`

**Описание:** Принимает имя и возраст, возвращает данные с полем `is_adult`

**Пример запроса:**
```bash
curl -X POST http://localhost:8080/user \
  -H "Content-Type: application/json" \
  -d '{"name": "Tsukanov Maksim", "age": 19}'
```

**Ответ:**
```json
{
  "name": "Tsukanov Maksim",
  "age": 19,
  "is_adult": true
}
```

**Пример с несовершеннолетним:**
```bash
curl -X POST http://localhost:8080/user \
  -H "Content-Type: application/json" \
  -d '{"name": "Иван", "age": 16}'
```

**Ответ:**
```json
{
  "name": "Иван",
  "age": 16,
  "is_adult": false
}
```

---

### 🌟 Задание 2.1 - Отправка отзыва

**Эндпоинт:** `POST /feedback`

**Описание:** Принимает имя и сообщение, сохраняет отзыв

**Пример запроса:**
```bash
curl -X POST http://localhost:8080/feedback \
  -H "Content-Type: application/json" \
  -d '{"name": "Rustam", "message": "Отличный день! Мне нравится ходить в школу!"}'
```

**Ответ:**
```json
{
  "message": "Спасибо, Rustam! Ваш отзыв сохранён."
}
```

---

### 🌟 Задание 2.2* - Валидация отзывов

**Эндпоинт:** `POST /feedback` (тот же, с валидацией)

**Описание:** Проверяет корректность данных и запрещает недопустимые слова

**Правила валидации:**
- `name`: от 2 до 50 символов
- `message`: от 10 до 500 символов
- Запрещённые слова: "кринж", "рофл", "вайб"

**Пример корректного запроса:**
```bash
curl -X POST http://localhost:8080/feedback \
  -H "Content-Type: application/json" \
  -d '{"name": "Артур", "message": "Это тяжело, но я справлюсь!"}'
```

**Ответ:**
```json
{
  "message": "Спасибо, Артур! Ваш отзыв сохранён."
}
```

**Пример НЕкорректного запроса (короткое имя):**
```bash
curl -X POST http://localhost:8080/feedback \
  -H "Content-Type: application/json" \
  -d '{"name": "А", "message": "Какой-то длинный текст для валидации"}'
```

**Ответ (HTTP 422):**
```json
{
  "detail": [
    {
      "type": "string_length_error",
      "loc": ["body", "name"],
      "msg": "String should have at least 2 characters",
      "input": "А",
      "ctx": {
        "min_length": 2
      }
    }
  ]
}
```

**Пример с недопустимым словом:**
```bash
curl -X POST http://localhost:8080/feedback \
  -H "Content-Type: application/json" \
  -d '{"name": "Иван", "message": "Полный кринж это все"}'
```

**Ответ (HTTP 422):**
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "message"],
      "msg": "Value error, Использование недопустимых слов",
      "input": "Полный кринж это все",
      "ctx": { "error": {} }
    }
  ]
}
```

---

### 📌 Дополнительный эндпоинт

**Эндпоинт:** `GET /feedbacks`

**Описание:** Показывает все сохранённые отзывы

**Пример запроса:**
```bash
curl http://localhost:8080/feedbacks
```

**Ответ:**
```json
{
  "count": 2,
  "feedbacks": [
    {
      "name": "Rustam",
      "message": "Отличный день! Мне нравится ходить в школу!",
      "timestamp": "2026-03-05T10:30:00.000Z"
    },
    {
      "name": "Артур",
      "message": "Это тяжело, но я справлюсь!",
      "timestamp": "2026-03-05T10:31:00.000Z"
    }
  ]
}
```

---

## 🧪 Тестирование

### Автоматическое тестирование:
```bash
bash test_requests.sh
```

### Ручное тестирование:
Используй **cURL**, **Postman**, **Thunder Client** или **REST Client**

---

## 🔄 Сравнение FastAPI (Python) vs Express.js (Node.js)

| Аспект                  | FastAPI (Python)              | Express.js (Node.js)           |
|-------------------------|-------------------------------|--------------------------------|
| **Запуск сервера**      | `uvicorn app:app --reload`    | `node app.js` или `nodemon`   |
| **Модели данных**       | Pydantic (`BaseModel`)        | JavaScript классы             |
| **Валидация**           | Автоматическая (Pydantic)     | Ручная проверка               |
| **Маршруты**            | `@app.get("/")`               | `app.get("/", ...)`           |
| **Импорты**             | `from pydantic import`        | `require("express")`          |
| **Документация API**    | Swagger UI (автоматически)    | Требует настройки             |

---

## 📝 Что было исправлено в твоём коде

### ❌ Было:
```javascript
app.get('/hi', (req, res) => {
  res.json({ message: 'Добро пожаловать...' })
});

app.get("/calculate", (req,res)=>{
  const num1 = 5;  // жёстко заданы
  const num2 = 10;
  res.json(num1 + num2)
})

const user = {
  name: "Tsukanov Maksim",
  id: 1,
  age: 19  // не нужен для задания 1.4
};
```

### ✅ Стало:
```javascript
// Задание 1.1 - корневой маршрут
app.get('/', (req, res) => {
  res.json({ message: 'Добро пожаловать...' })
});

// Задание 1.3 - POST с телом запроса
app.post("/calculate", (req, res) => {
  const { num1, num2 } = req.body;
  res.json({ result: num1 + num2 })
})

// Задание 1.4 - использование модели из models.js
const { User } = require("./models");
const user = new User("Tsukanov Maksim", 1);
```

---

## 🎓 Автор

**Tsukanov Maksim**  
Дата: Март 2026

---

## 💡 Полезные команды

```bash
# Установка зависимостей
npm install

# Запуск сервера
npm start

# Запуск с автоперезагрузкой
npm run dev

# Тестирование всех эндпоинтов
bash test_requests.sh

# Просмотр логов
# (выводятся автоматически в консоль)
```
