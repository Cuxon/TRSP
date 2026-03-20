// app.js — Практическое занятие №3
// Обработка HTTP-запросов и их проверка
// Аналог FastAPI (Python) → Express.js (Node.js)
// Автор: Tsukanov Maksim

const express = require("express");
const multer = require("multer"); // аналог File/UploadFile в FastAPI
const { User, UserResponse, Event, Item, UserCreate } = require("./models");

const app = express();
const PORT = 8000;

// Multer: хранит загруженные файлы в памяти (как File() в FastAPI)
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(express.json()); // парсинг JSON-тела (application/json)
app.use(express.urlencoded({ extended: true })); // парсинг форм (application/x-www-form-urlencoded)

// ============================================================
// 🦄 HTTP-ОПЕРАЦИИ (Operations)
// Аналог декораторов @app.get(), @app.post(), @app.put() и т.д.
// ============================================================

// GET /users — получение списка (аналог @app.get("/users"))
app.get("/users", (req, res) => {
  res.json({ message: "Список пользователей" });
});

// POST /users — создание ресурса (аналог @app.post("/users"))
app.post("/users", (req, res) => {
  res.json({ message: "Создан новый пользователь" });
});

// PUT /users/:user_id — полное обновление (аналог @app.put("/users/{user_id}"))
app.put("/users/:user_id", (req, res) => {
  const user_id = parseInt(req.params.user_id);
  res.json({ message: `Пользователь ${user_id} обновлён` });
});

// DELETE /users/:user_id — удаление (аналог @app.delete("/users/{user_id}"))
app.delete("/users/:user_id", (req, res) => {
  const user_id = parseInt(req.params.user_id);
  res.json({ message: `Пользователь ${user_id} удалён` });
});

// PATCH /users/:user_id — частичное обновление (аналог @app.patch("/users/{user_id}"))
app.patch("/users/:user_id", (req, res) => {
  const user_id = parseInt(req.params.user_id);
  res.json({ message: `Пользователь ${user_id} частично обновлён` });
});

// OPTIONS / — экзотический метод (аналог @app.options("/"))
app.options("/", (req, res) => {
  res.json({ message: "Этот запрос проверяет, какие методы доступны" });
});

// HEAD / — возвращает только заголовки, без тела (аналог @app.head("/"))
// В Express HEAD-запросы к GET-маршрутам обрабатываются автоматически,
// но можно определить явно:
app.head("/", (req, res) => {
  res.set("X-Custom-Header", "head-response");
  res.status(200).end(); // тело не отправляем — только заголовки
});

// TRACE — не поддерживается напрямую в Express, обрабатываем через middleware
app.use("/", (req, res, next) => {
  if (req.method === "TRACE") {
    return res
      .status(200)
      .type("message/http")
      .send(`TRACE ${req.path} HTTP/1.1\r\nHost: ${req.headers.host}\r\n`);
  }
  next();
});

// ============================================================
// 🌸 ОБРАБОТКА ДАННЫХ ФОРМ (Form Data)
// Аналог Form() в FastAPI
// express.urlencoded() — аналог Form(...), парсит application/x-www-form-urlencoded
// ============================================================

// POST /submit/ — аналог:
// async def submit_form(username: str = Form(...), password: str = Form(...))
app.post("/submit/", (req, res) => {
  const { username, password } = req.body;

  if (!username || typeof username !== "string") {
    return res.status(422).json({
      detail: [{ loc: ["body", "username"], msg: "Field required" }],
    });
  }
  if (!password || typeof password !== "string") {
    return res.status(422).json({
      detail: [{ loc: ["body", "password"], msg: "Field required" }],
    });
  }

  // Пароль не возвращаем — только его длину (как в примере из материала)
  res.json({ username, password_length: password.length });
});

// POST /register/ — аналог нескольких Form()-полей
// async def register_user(username, email, age: int, password)
app.post("/register/", (req, res) => {
  const { username, email, age, password } = req.body;

  if (!username)
    return res.status(422).json({ detail: [{ loc: ["body", "username"], msg: "Field required" }] });
  if (!email)
    return res.status(422).json({ detail: [{ loc: ["body", "email"], msg: "Field required" }] });
  if (!age)
    return res.status(422).json({ detail: [{ loc: ["body", "age"], msg: "Field required" }] });
  if (!password)
    return res.status(422).json({ detail: [{ loc: ["body", "password"], msg: "Field required" }] });

  const parsedAge = parseInt(age);
  if (isNaN(parsedAge)) {
    return res.status(422).json({
      detail: [{ loc: ["body", "age"], msg: "age должно быть целым числом" }],
    });
  }

  res.json({
    username,
    email,
    age: parsedAge, // FastAPI автоматически преобразует строку формы в int
    password_length: password.length,
  });
});

// ============================================================
// 🦩 РАБОТА С JSON И PYDANTIC-МОДЕЛЯМИ
// Аналог BaseModel из Pydantic
// ============================================================

// POST /json-users/ — аналог:
// @app.post("/users/", response_model=UserResponse)
// async def create_user(user: User):
//
// response_model=UserResponse — FastAPI отфильтрует ответ по схеме модели.
// Здесь мы делаем это явно через класс UserResponse.
app.post("/json-users/", (req, res) => {
  try {
    const user = new User(req.body);
    const response = new UserResponse(`Пользователь ${user.name} создан!`, user);
    res.json(response);
  } catch (err) {
    // FastAPI возвращает 422 при ошибке валидации
    res.status(422).json({
      detail: [{ msg: err.message }],
    });
  }
});

// POST /events/ — аналог datetime-поля с автоматической конвертацией:
// class Event(BaseModel):
//     name: str
//     timestamp: datetime  ← FastAPI парсит ISO 8601 строку в datetime
//
// Запрос: { "name": "Уник", "timestamp": "2026-03-20T09:00:00" }
// Ответ:  { "name": "Уник", "timestamp": "2026-03-20T09:00:00.000Z" }
app.post("/events/", (req, res) => {
  try {
    const event = new Event(req.body);
    res.json(event); // toJSON() вызывается автоматически → timestamp → ISO-строка
  } catch (err) {
    res.status(422).json({ detail: [{ msg: err.message }] });
  }
});

// ============================================================
// ☂ ЗАГРУЗКА ФАЙЛОВ (File Upload)
// multer — аналог File/UploadFile из FastAPI
// ============================================================

// POST /files/ — аналог File() — загружает файл в память как bytes
// async def create_file(file: Annotated[bytes, File()]):
//     return {"file_size": len(file)}
app.post("/files/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(422).json({ detail: "Файл не загружен" });
  }
  // req.file.buffer — это байты файла (аналог bytes в Python)
  res.json({ file_size: req.file.size });
});

// POST /uploadfile/ — аналог UploadFile — даёт доступ к метаданным файла
// async def create_upload_file(file: UploadFile):
//     return {"filename": file.filename}
app.post("/uploadfile/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(422).json({ detail: "Файл не загружен" });
  }
  // req.file.originalname — аналог file.filename
  // req.file.mimetype — аналог file.content_type
  res.json({
    filename: req.file.originalname,
    size: req.file.size, // аналог len(await file.read())
  });
});

// POST /multiple-files/ — аналог List[UploadFile]
// async def upload_multiple_files(files: List[UploadFile]):
//     return {"filenames": [file.filename for file in files]}
app.post("/multiple-files/", upload.array("files"), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(422).json({ detail: "Файлы не загружены" });
  }
  res.json({ filenames: req.files.map((f) => f.originalname) });
});

// POST /upload-image/ — ограничение по типу файла
// Аналог проверки file.content_type в FastAPI
app.post("/upload-image/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(422).json({ detail: "Файл не загружен" });
  }
  if (!["image/jpeg", "image/png"].includes(req.file.mimetype)) {
    return res.json({ error: "Только JPG и PNG разрешены" });
  }
  res.json({
    filename: req.file.originalname,
    content_type: req.file.mimetype,
  });
});

// ============================================================
// 📌 ПАРАМЕТРЫ ЗАПРОСА (Query Parameters)
// Аналог Query() из FastAPI
// ============================================================

const fakeItemsDb = [
  { item_name: "Foo" },
  { item_name: "Bar" },
  { item_name: "Baz" },
];

// GET /items/ — аналог:
// async def read_item(
//     skip: int = Query(0, alias="start", ge=0),
//     limit: int = Query(10, le=100)
// ):
//
// alias="start" → в URL можно писать ?start=0 вместо ?skip=0
// ge=0 → >= 0 (greater or equal)
// le=100 → <= 100 (less or equal)
app.get("/items/", (req, res) => {
  // Поддерживаем alias: ?start=0 — аналог alias="start" в Query()
  const skipRaw = req.query.start ?? req.query.skip ?? "0";
  const limitRaw = req.query.limit ?? "10";

  const skip = parseInt(skipRaw);
  const limit = parseInt(limitRaw);

  // Аналог ge=0
  if (isNaN(skip) || skip < 0) {
    return res.status(422).json({
      detail: [{ loc: ["query", "skip"], msg: "Value should be >= 0" }],
    });
  }
  // Аналог le=100
  if (isNaN(limit) || limit > 100) {
    return res.status(422).json({
      detail: [{ loc: ["query", "limit"], msg: "Value should be <= 100" }],
    });
  }

  res.json(fakeItemsDb.slice(skip, skip + limit));
});

// GET /items/search — аналог pattern="^fixedprefix_" в Query()
// async def read_item(q: str = Query(..., pattern="^fixedprefix_")):
//
// ВАЖНО: маршрут /items/search нужно объявить ДО /items/:id,
// чтобы Express не перепутал "search" с числовым id.
app.get("/items/search", (req, res) => {
  const q = req.query.q;
  if (!q) {
    return res.status(422).json({
      detail: [{ loc: ["query", "q"], msg: "Field required" }],
    });
  }
  // Аналог pattern="^fixedprefix_"
  if (!/^fixedprefix_/.test(q)) {
    return res.status(422).json({
      detail: [
        {
          loc: ["query", "q"],
          msg: 'String should match pattern "^fixedprefix_"',
          input: q,
        },
      ],
    });
  }
  res.json({ q });
});

// ============================================================
// 🥀 ОБЪЕДИНЕНИЕ ПАРАМЕТРОВ ПУТИ И ЗАПРОСА
// Path-параметр + Query-параметр в одном маршруте
// ============================================================

// GET /users/:user_id — аналог:
// @app.get("/users/{user_id}")
// def read_user(user_id: int, is_admin: bool = False):
//
// user_id — параметр пути (Path), обязательный
// is_admin — параметр запроса (Query), необязательный, по умолчанию false
app.get("/users/:user_id", (req, res) => {
  const user_id = parseInt(req.params.user_id);

  // Аналог валидации типа int для параметра пути
  if (isNaN(user_id)) {
    return res.status(422).json({
      detail: [
        {
          loc: ["path", "user_id"],
          msg: "Value should be a valid integer",
          input: req.params.user_id,
        },
      ],
    });
  }

  // Аналог bool-параметра запроса: FastAPI принимает "true"/"false"/"1"/"0"
  const is_admin = req.query.is_admin === "true" || req.query.is_admin === "1";

  res.json({ user_id, is_admin });
});

// ============================================================
// 🐙 ТЕЛО ЗАПРОСА — BODY PARAMETERS (Item BaseModel)
// ============================================================

// POST /items/ — аналог:
// @app.post("/items/")
// async def create_item(item: Item):
//     return item
//
// Item содержит обязательные поля (name, price) и опциональные (description, tax).
// В Python: description: str | None = None означает поле с дефолтом None.
app.post("/items/", (req, res) => {
  try {
    const item = new Item(req.body);
    res.json(item);
  } catch (err) {
    res.status(422).json({ detail: [{ msg: err.message }] });
  }
});

// ============================================================
// 🌟 ЗАДАНИЕ 3.1 — POST /create_user
// ============================================================

// Аналог Python-кода:
// class UserCreate(BaseModel):
//     name: str
//     email: EmailStr
//     age: int | None = None
//     is_subscribed: bool | None = None
//
// @app.post("/create_user")
// async def create_user(user: UserCreate):
//     return user
app.post("/create_user", (req, res) => {
  try {
    const user = new UserCreate(req.body);
    res.json(user);
  } catch (err) {
    res.status(422).json({ detail: [{ msg: err.message }] });
  }
});

// ============================================================
// 🌟 ЗАДАНИЕ 3.2 — /product/:product_id и /products/search
// ============================================================

// Данные из задания (аналог sample_products в Python)
const sampleProducts = [
  { product_id: 123, name: "Smartphone",  category: "Electronics",  price: 599.99  },
  { product_id: 456, name: "Phone Case",  category: "Accessories",  price: 19.99   },
  { product_id: 789, name: "Iphone",      category: "Electronics",  price: 1299.99 },
  { product_id: 101, name: "Headphones",  category: "Accessories",  price: 99.99   },
  { product_id: 202, name: "Smartwatch",  category: "Electronics",  price: 299.99  },
];

// GET /products/search — объявляем ПЕРВЫМ, чтобы Express не спутал "search" с product_id.
// В задании об этом прямо сказано: маршруты обрабатываются в порядке объявления.
//
// Аналог:
// @app.get("/products/search")
// async def search_products(
//     keyword: str,
//     category: str | None = None,
//     limit: int = 10
// ):
app.get("/products/search", (req, res) => {
  const { keyword, category, limit: limitRaw } = req.query;

  // keyword — обязательный параметр
  if (!keyword) {
    return res.status(422).json({
      detail: [{ loc: ["query", "keyword"], msg: "Field required" }],
    });
  }

  const limit = limitRaw !== undefined ? parseInt(limitRaw) : 10;
  if (isNaN(limit) || limit <= 0) {
    return res.status(422).json({
      detail: [{ loc: ["query", "limit"], msg: "limit должен быть положительным числом" }],
    });
  }

  let results = sampleProducts.filter((p) =>
    p.name.toLowerCase().includes(keyword.toLowerCase())
  );

  // Фильтрация по категории (необязательный параметр)
  if (category) {
    results = results.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  res.json(results.slice(0, limit));
});

// GET /product/:product_id — получение одного товара по ID
//
// Аналог:
// @app.get("/product/{product_id}")
// async def get_product(product_id: int):
//     ...
app.get("/product/:product_id", (req, res) => {
  const product_id = parseInt(req.params.product_id);

  if (isNaN(product_id)) {
    return res.status(422).json({
      detail: [{ loc: ["path", "product_id"], msg: "Value should be a valid integer" }],
    });
  }

  const product = sampleProducts.find((p) => p.product_id === product_id);

  if (!product) {
    return res.status(404).json({ detail: "Продукт не найден" });
  }

  res.json(product);
});

// ============================================================
// Запуск сервера
// ============================================================
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`\nДоступные маршруты:`);
  console.log(`  GET    http://localhost:${PORT}/users`);
  console.log(`  POST   http://localhost:${PORT}/users`);
  console.log(`  PUT    http://localhost:${PORT}/users/1`);
  console.log(`  DELETE http://localhost:${PORT}/users/1`);
  console.log(`  PATCH  http://localhost:${PORT}/users/1`);
  console.log(`  POST   http://localhost:${PORT}/submit/`);
  console.log(`  POST   http://localhost:${PORT}/register/`);
  console.log(`  POST   http://localhost:${PORT}/json-users/`);
  console.log(`  POST   http://localhost:${PORT}/events/`);
  console.log(`  POST   http://localhost:${PORT}/files/`);
  console.log(`  POST   http://localhost:${PORT}/uploadfile/`);
  console.log(`  POST   http://localhost:${PORT}/multiple-files/`);
  console.log(`  POST   http://localhost:${PORT}/upload-image/`);
  console.log(`  GET    http://localhost:${PORT}/items/?start=0&limit=10`);
  console.log(`  GET    http://localhost:${PORT}/items/search?q=fixedprefix_test`);
  console.log(`  GET    http://localhost:${PORT}/users/1?is_admin=true`);
  console.log(`  POST   http://localhost:${PORT}/items/`);
});
