# Практическое занятие №3
## Обработка HTTP-запросов и их проверка

Выполнил: **Tsukanov Maksim**

> Все концепции из FastAPI (Python) адаптированы под **Node.js + Express.js**

---

## Установка и запуск

```bash
npm install
npm run dev    # режим разработки (с автоперезагрузкой)
# или
npm start      # обычный запуск
```

Сервер запустится на `http://localhost:8000`

---

## Соответствие FastAPI → Express.js

| FastAPI (Python)             | Express.js (Node.js)                          |
|------------------------------|-----------------------------------------------|
| `@app.get()`, `@app.post()`  | `app.get()`, `app.post()`                     |
| `Form(...)`                  | `express.urlencoded()` + `req.body`           |
| `BaseModel` (Pydantic)       | JS-класс с ручной валидацией в `models.js`    |
| `response_model=`            | Класс `UserResponse` с явной структурой       |
| `datetime` в Pydantic        | `new Date()` + `.toISOString()`               |
| `File()` / `UploadFile`      | `multer` (`req.file`, `req.files`)            |
| `Query(ge=0, le=100)`        | Ручная проверка `parseInt()` + условия        |
| `Query(alias="start")`       | `req.query.start ?? req.query.skip`           |
| `Query(pattern="^...")`      | Регулярное выражение `/.test()`               |
| `str \| None = None`         | Параметр по умолчанию `= null`                |

---

## Маршруты

### 🦄 HTTP-операции
| Метод    | Маршрут             | Описание                        |
|----------|---------------------|---------------------------------|
| GET      | `/users`            | Список пользователей            |
| POST     | `/users`            | Создать пользователя            |
| PUT      | `/users/:id`        | Полное обновление               |
| DELETE   | `/users/:id`        | Удалить пользователя            |
| PATCH    | `/users/:id`        | Частичное обновление            |
| OPTIONS  | `/`                 | Доступные методы                |
| HEAD     | `/`                 | Только заголовки, без тела      |

### 🌸 Данные форм (Form Data)
| Метод | Маршрут       | Тело запроса                             |
|-------|---------------|------------------------------------------|
| POST  | `/submit/`    | `username=...&password=...`              |
| POST  | `/register/`  | `username=...&email=...&age=...&password=...` |

### 🦩 JSON + модели
| Метод | Маршрут        | Тело запроса                            |
|-------|----------------|-----------------------------------------|
| POST  | `/json-users/` | `{"name":"Артур","age":26}`             |
| POST  | `/events/`     | `{"name":"Уник","timestamp":"2026-03-20T09:00:00"}` |

### ☂ Загрузка файлов (multipart/form-data)
| Метод | Маршрут            | Поле формы       |
|-------|--------------------|------------------|
| POST  | `/files/`          | `file` (bytes)   |
| POST  | `/uploadfile/`     | `file`           |
| POST  | `/multiple-files/` | `files` (несколько) |
| POST  | `/upload-image/`   | `file` (JPG/PNG) |

### 📌 Параметры запроса (Query)
| Метод | Маршрут                                        | Описание                   |
|-------|------------------------------------------------|----------------------------|
| GET   | `/items/?start=0&limit=10`                     | Пагинация с алиасом        |
| GET   | `/items/search?q=fixedprefix_test`             | Проверка по паттерну       |

### 🥀 Параметры пути + запроса
| Метод | Маршрут                         | Описание                  |
|-------|---------------------------------|---------------------------|
| GET   | `/users/:id?is_admin=true`      | Path + Query параметры    |

### 🐙 Тело запроса (Body)
| Метод | Маршрут   | Тело запроса (JSON)                              |
|-------|-----------|--------------------------------------------------|
| POST  | `/items/` | `{"name":"...", "price":99.9}` (description и tax опциональны) |

---

## Структура проекта

```
FAPI3/
├── app.js       # Основной файл (аналог main.py в FastAPI)
├── models.js    # Модели данных (аналог Pydantic BaseModel)
├── package.json
└── README.md
```
