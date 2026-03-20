// app.js — Практическое занятие №5
// Куки с подписью, динамические сессии, заголовки
// Аналог FastAPI (Python) → Express.js (Node.js)
// Автор: Tsukanov Maksim

const express = require("express");
const cookieParser = require("cookie-parser"); // аналог встроенного механизма FastAPI для чтения кук
const crypto = require("crypto");              // встроенный модуль Node.js — аналог библиотеки itsdangerous
const { CommonHeaders } = require("./models");

const app = express();
const PORT = 8000;

// ─── Секретный ключ ──────────────────────────────────────────────────────────
// В Python (itsdangerous): signer = TimestampSigner(SECRET_KEY)
// В реальном проекте хранится в .env, не в коде
const SECRET_KEY = "super-secret-key-for-signing-12345";

// ─── Фиктивная БД пользователей ─────────────────────────────────────────────
const USERS = {
  alice: "password123",
  bob: "qwerty",
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // подключаем парсер кук → req.cookies

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ — аналог itsdangerous
// ============================================================

// Аналог HMAC-подписи в itsdangerous (TimestampSigner использует HMAC-SHA1/256 внутри)
function hmacSign(data) {
  return crypto.createHmac("sha256", SECRET_KEY).update(data).digest("hex");
}

// Безопасное сравнение строк (защита от timing-атак)
// Аналог secrets.compare_digest() в Python
function safeCompare(a, b) {
  try {
    // Строки должны быть одной длины для timingSafeEqual
    return (
      a.length === b.length &&
      crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
    );
  } catch {
    return false;
  }
}

// ============================================================
// 🌟 ЗАДАНИЕ 5.2 — Подписанные куки
// Формат: <user_id>.<signature>
// Аналог itsdangerous.Signer
// ============================================================

// Создаёт токен: <uuid>.<hmac_подпись>
// Аналог: signer.sign(user_id)  — itsdangerous сам добавляет точку и подпись
function createToken52(userId) {
  const signature = hmacSign(userId);
  return `${userId}.${signature}`;
}

// Проверяет и разбирает токен
// Аналог: signer.unsign(token) — itsdangerous сам разбивает и проверяет, бросает BadSignature
function verifyToken52(token) {
  // UUID не содержит точек, поэтому первая точка — разделитель
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return null;

  const userId = token.substring(0, dotIndex);
  const signature = token.substring(dotIndex + 1);
  const expectedSig = hmacSign(userId);

  if (!safeCompare(expectedSig, signature)) return null;
  return userId;
}

// POST /login — логин, установка подписанной куки (задание 5.2)
// Аналог FastAPI: принимает JSON или form-данные
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "username и password обязательны" });
  }
  if (!USERS[username] || USERS[username] !== password) {
    return res.status(401).json({ message: "Неверные учётные данные" });
  }

  // crypto.randomUUID() — аналог uuid.uuid4() в Python (UUID v4, RFC 4122)
  const userId = crypto.randomUUID();
  const token = createToken52(userId);

  // Устанавливаем куку — аналог FastAPI:
  // response.set_cookie("session_token", token, httponly=True, max_age=3600)
  res.cookie("session_token", token, {
    httpOnly: true,   // httponly=True — браузерный JS не может прочитать куку
    maxAge: 3_600_000, // max_age=3600 секунд → в Express миллисекунды
    sameSite: "lax",
  });

  res.json({ message: `Добро пожаловать, ${username}!`, user_id: userId });
});

// GET /profile — защищённый маршрут (задание 5.2)
// Аналог FastAPI:
// @app.get("/profile")
// def profile(session_token: str = Cookie(None)):
//     user_id = signer.unsign(session_token)  # бросает исключение если подпись неверна
app.get("/profile", (req, res) => {
  const token = req.cookies["session_token"];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = verifyToken52(token);
  if (!userId) {
    // Подпись не совпала — данные подделаны
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json({ message: "Профиль пользователя", user_id: userId });
});

// ============================================================
// 🌟 ЗАДАНИЕ 5.3 — Динамическое время жизни сессии
// Формат: <user_id>.<timestamp>.<signature>
// Сессия живёт 5 минут с момента последней активности.
// Обновляется, если с последней активности прошло >= 3 и < 5 минут.
// ============================================================

const SESSION_LIFETIME = 300;     // 5 минут = 300 секунд
const SESSION_RENEW_AFTER = 180;  // обновлять если прошло >= 3 минуты = 180 секунд

// Создаёт токен с временем активности:
// Аналог TimestampSigner из itsdangerous, который подписывает данные вместе с временем
function createToken53(userId) {
  const timestamp = Math.floor(Date.now() / 1000); // UNIX timestamp в секундах
  const data = `${userId}.${timestamp}`;
  const signature = hmacSign(data); // подписываем ОБА значения вместе
  return `${data}.${signature}`;
  // Итог: "d92d5e6e-98a1-4c2a-b3c7-5d5e8d7f8e9a.1715000400.signature_abc123"
}

// Проверяет токен 5.3
// Возвращает { userId, timestamp, elapsed } или { error: "expired" | "invalid" }
function verifyToken53(token) {
  // UUID не содержит точек → split('.') даёт ровно 3 части
  const parts = token.split(".");
  if (parts.length !== 3) return { error: "invalid" };

  const [userId, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (!userId || isNaN(timestamp)) return { error: "invalid" };

  // Проверяем подпись обоих значений (user_id + timestamp)
  // Любое изменение userId или timestamp → другой HMAC → немедленный запрет
  const data = `${userId}.${timestamp}`;
  const expectedSig = hmacSign(data);

  if (!safeCompare(expectedSig, signature)) {
    return { error: "invalid" }; // данные подделаны
  }

  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - timestamp;

  // Синхронизируем время с сервером — если elapsed < 0, что-то не так
  if (elapsed < 0) return { error: "invalid" };

  if (elapsed >= SESSION_LIFETIME) {
    return { error: "expired" }; // сессия истекла (прошло >= 5 минут)
  }

  return { userId, timestamp, elapsed };
}

// POST /login53 — логин с динамической сессией
app.post("/login53", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "username и password обязательны" });
  }
  if (!USERS[username] || USERS[username] !== password) {
    return res.status(401).json({ message: "Неверные учётные данные" });
  }

  const userId = crypto.randomUUID();
  const token = createToken53(userId);

  // secure: false — для тестирования, в продакшене должно быть true
  res.cookie("session_token", token, {
    httpOnly: true,
    maxAge: SESSION_LIFETIME * 1000, // max_age=300 секунд
    sameSite: "lax",
    secure: false,
  });

  res.json({ message: `Добро пожаловать, ${username}!`, user_id: userId });
});

// GET /profile53 — защищённый маршрут с обновлением сессии
// Логика обновления (из задания):
//   elapsed < 3 мин  → куку НЕ обновляем
//   3 мин <= elapsed < 5 мин → обновляем куку (новый timestamp, новые 5 минут)
//   elapsed >= 5 мин → 401 Session expired
app.get("/profile53", (req, res) => {
  const token = req.cookies["session_token"];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const result = verifyToken53(token);

  if (result.error === "invalid") {
    // Подпись не совпала — данные подделаны (изменили user_id или timestamp)
    return res.status(401).json({ message: "Invalid session" });
  }

  if (result.error === "expired") {
    // Прошло >= 5 минут — сессия истекла
    return res.status(401).json({ message: "Session expired" });
  }

  const { userId, elapsed } = result;

  // Решаем, обновлять ли куку
  const shouldRenew = elapsed >= SESSION_RENEW_AFTER; // >= 3 минут

  if (shouldRenew) {
    // Создаём новый токен с текущим timestamp → сессия продлевается на 5 минут
    const newToken = createToken53(userId);
    res.cookie("session_token", newToken, {
      httpOnly: true,
      maxAge: SESSION_LIFETIME * 1000,
      sameSite: "lax",
      secure: false,
    });
  }

  res.json({
    message: "Профиль пользователя",
    user_id: userId,
    session_age_seconds: elapsed,
    cookie_renewed: shouldRenew,
  });
});

// ============================================================
// 🌟 ЗАДАНИЕ 5.4 — Заголовки запроса
// Аналог request.headers в FastAPI
// ============================================================

// GET /headers — извлекает User-Agent и Accept-Language
// Аналог FastAPI:
// @app.get("/headers")
// async def get_headers(request: Request):
//     user_agent = request.headers.get("User-Agent")
//     accept_language = request.headers.get("Accept-Language")
//     if not user_agent or not accept_language:
//         raise HTTPException(status_code=400, detail="...")
app.get("/headers", (req, res) => {
  const userAgent = req.headers["user-agent"];
  const acceptLanguage = req.headers["accept-language"];

  // Аналог raise HTTPException(status_code=400, detail="...")
  if (!userAgent || !acceptLanguage) {
    return res.status(400).json({
      detail: "Обязательные заголовки отсутствуют: User-Agent и/или Accept-Language",
    });
  }

  // Необязательная валидация формата Accept-Language (из задания)
  const acceptLangRegex =
    /^([a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*|\*)(;q=[01](\.[0-9]{1,3})?)?(,\s*([a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*|\*)(;q=[01](\.[0-9]{1,3})?)?)*$/;

  if (!acceptLangRegex.test(acceptLanguage)) {
    return res.status(400).json({
      detail: "Заголовок Accept-Language имеет неверный формат",
    });
  }

  res.json({
    "User-Agent": userAgent,
    "Accept-Language": acceptLanguage,
  });
});

// ============================================================
// 🌟 ЗАДАНИЕ 5.5 — CommonHeaders (принцип DRY)
// Один класс CommonHeaders переиспользуется в двух маршрутах.
// Аналог Pydantic-модели + Header() dependency в FastAPI.
// ============================================================

// GET /headers55 — маршрут 1: возвращает заголовки через CommonHeaders
// Аналог:
// @app.get("/headers")
// async def headers_route(headers: Annotated[CommonHeaders, Header()]):
//     return {"User-Agent": headers.user_agent, "Accept-Language": headers.accept_language}
app.get("/headers55", (req, res) => {
  try {
    const headers = new CommonHeaders(req.headers);
    res.json(headers);
  } catch (err) {
    res.status(err.status || 400).json({ detail: err.detail });
  }
});

// GET /info — маршрут 2: использует тот же CommonHeaders + добавляет X-Server-Time
// Аналог:
// @app.get("/info")
// async def info_route(headers: Annotated[CommonHeaders, Header()], response: Response):
//     response.headers["X-Server-Time"] = datetime.now().isoformat()
//     return {"message": "...", "headers": {...}}
app.get("/info", (req, res) => {
  try {
    const headers = new CommonHeaders(req.headers);

    // Добавляем кастомный заголовок ответа — аналог response.headers["X-Server-Time"]
    res.set("X-Server-Time", new Date().toISOString().slice(0, 19));

    res.json({
      message: "Добро пожаловать! Ваши заголовки успешно обработаны.",
      headers,
    });
  } catch (err) {
    res.status(err.status || 400).json({ detail: err.detail });
  }
});

// ============================================================
// Запуск сервера
// ============================================================
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}\n`);
  console.log("Маршруты:");
  console.log(`  POST http://localhost:${PORT}/login         (5.2 — логин)`);
  console.log(`  GET  http://localhost:${PORT}/profile       (5.2 — профиль)`);
  console.log(`  POST http://localhost:${PORT}/login53       (5.3 — логин с сессией)`);
  console.log(`  GET  http://localhost:${PORT}/profile53     (5.3 — профиль с обновлением)`);
  console.log(`  GET  http://localhost:${PORT}/headers       (5.4 — заголовки)`);
  console.log(`  GET  http://localhost:${PORT}/headers55     (5.5 — заголовки через CommonHeaders)`);
  console.log(`  GET  http://localhost:${PORT}/info          (5.5 — заголовки + X-Server-Time)`);
});
