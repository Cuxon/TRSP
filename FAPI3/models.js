// models.js — аналог Python-файла с Pydantic-моделями
// В FastAPI модели наследуются от BaseModel и автоматически валидируют данные.
// Здесь мы делаем то же самое вручную через JS-классы.

/**
 * Аналог:
 * class User(BaseModel):
 *     name: str
 *     age: int
 */
class User {
  constructor({ name, age }) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new TypeError("name должно быть непустой строкой");
    }
    if (typeof age !== "number" || !Number.isInteger(age)) {
      throw new TypeError("age должно быть целым числом");
    }
    this.name = name;
    this.age = age;
  }
}

/**
 * Аналог вложенной модели ответа:
 * class UserResponse(BaseModel):
 *     message: str
 *     user: User
 *
 * В FastAPI: @app.post("/users/", response_model=UserResponse)
 */
class UserResponse {
  constructor(message, user) {
    this.message = message;
    this.user = { name: user.name, age: user.age };
  }
}

/**
 * Аналог:
 * class Event(BaseModel):
 *     name: str
 *     timestamp: datetime
 *
 * FastAPI автоматически парсит ISO 8601 строку в datetime.
 * Здесь используем встроенный Date.
 */
class Event {
  constructor({ name, timestamp }) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new TypeError("name должно быть непустой строкой");
    }
    const parsed = new Date(timestamp);
    if (isNaN(parsed.getTime())) {
      throw new TypeError(
        'timestamp должен быть строкой формата ISO 8601, например "2026-03-20T09:00:00"'
      );
    }
    this.name = name;
    // Храним как объект Date, при сериализации в JSON → ISO-строка (аналог FastAPI)
    this.timestamp = parsed;
  }

  toJSON() {
    return {
      name: this.name,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * Аналог:
 * class Item(BaseModel):
 *     name: str
 *     description: str | None = None   # Опциональное поле
 *     price: float
 *     tax: float | None = None         # Опциональное поле
 *
 * "| None = None" в Python означает, что поле необязательное.
 * Здесь реализуем через значения по умолчанию.
 */
class Item {
  constructor({ name, description = null, price, tax = null }) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new TypeError("name должно быть непустой строкой");
    }
    if (typeof price !== "number") {
      throw new TypeError("price должно быть числом (float)");
    }
    if (description !== null && typeof description !== "string") {
      throw new TypeError("description должно быть строкой или null");
    }
    if (tax !== null && typeof tax !== "number") {
      throw new TypeError("tax должно быть числом или null");
    }
    this.name = name;
    this.description = description;
    this.price = price;
    this.tax = tax;
  }
}

/**
 * Задание 3.1
 * Аналог:
 * class UserCreate(BaseModel):
 *     name: str
 *     email: EmailStr                  # встроенная Pydantic-валидация email
 *     age: int | None = None           # необязательное, но если есть — положительное
 *     is_subscribed: bool | None = None # необязательное
 *
 * Pydantic проверяет email через EmailStr автоматически.
 * Здесь используем простой регэксп — аналог того же поведения.
 */
class UserCreate {
  constructor({ name, email, age = null, is_subscribed = null }) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new TypeError("name: обязательное непустое поле");
    }

    // Аналог EmailStr — проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== "string" || !emailRegex.test(email)) {
      throw new TypeError("email: обязательное поле, должно быть валидным адресом");
    }

    // age необязательное, но если передано — должно быть положительным целым числом
    if (age !== null) {
      if (typeof age !== "number" || !Number.isInteger(age) || age <= 0) {
        throw new TypeError("age: если указано, должно быть положительным целым числом");
      }
    }

    // is_subscribed необязательное, но если передано — должно быть boolean
    if (is_subscribed !== null && typeof is_subscribed !== "boolean") {
      throw new TypeError("is_subscribed: если указано, должно быть true или false");
    }

    this.name = name;
    this.email = email;
    this.age = age;
    this.is_subscribed = is_subscribed;
  }
}

module.exports = { User, UserResponse, Event, Item, UserCreate };
