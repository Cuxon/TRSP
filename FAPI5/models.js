// models.js — модели для Практического занятия №5

/**
 * Задание 5.5 — CommonHeaders (принцип DRY — Don't Repeat Yourself)
 *
 * Аналог Pydantic-модели для заголовков в FastAPI:
 *
 * class CommonHeaders(BaseModel):
 *     model_config = {"populate_by_name": True}
 *     user_agent: str = Header(alias="User-Agent")
 *     accept_language: str = Header(alias="Accept-Language")
 *
 * В FastAPI модель внедряется как зависимость (Dependency Injection):
 *   async def headers_route(headers: Annotated[CommonHeaders, Header()]):
 *
 * Здесь мы создаём класс, который принимает req.headers и валидирует их.
 * Один класс — переиспользуется в двух маршрутах (/headers, /info).
 */

// Регэксп для валидации Accept-Language (необязательная проверка из задания)
// Корректные форматы: "en-US,en;q=0.9,es;q=0.8", "ru", "en-GB;q=0.8,*;q=0.5"
const ACCEPT_LANG_REGEX =
  /^([a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*|\*)(;q=[01](\.[0-9]{1,3})?)?(,\s*([a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*|\*)(;q=[01](\.[0-9]{1,3})?)?)*$/;

class CommonHeaders {
  constructor(reqHeaders) {
    // В Express заголовки приходят в нижнем регистре — Node.js приводит их к lower-case
    const userAgent = reqHeaders["user-agent"];
    const acceptLanguage = reqHeaders["accept-language"];

    if (!userAgent) {
      throw { status: 400, detail: "Заголовок User-Agent обязателен" };
    }
    if (!acceptLanguage) {
      throw { status: 400, detail: "Заголовок Accept-Language обязателен" };
    }

    // Необязательная валидация формата Accept-Language (п. из задания 5.4 и 5.5)
    if (!ACCEPT_LANG_REGEX.test(acceptLanguage)) {
      throw {
        status: 400,
        detail: "Заголовок Accept-Language имеет неверный формат",
      };
    }

    // Сохраняем с оригинальным регистром ключей — как в примере ответа из задания
    this["User-Agent"] = userAgent;
    this["Accept-Language"] = acceptLanguage;
  }
}

module.exports = { CommonHeaders };
