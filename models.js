// models.js - аналог models.py с Pydantic моделями

/**
 * Класс User - аналог Pydantic модели User из задания 1.4
 * 
 * В Python это выглядело бы так:
 * class User(BaseModel):
 *     name: str
 *     id: int
 */
class User {
  constructor(name, id) {
    // Валидация типов (аналог Pydantic)
    if (typeof name !== 'string') {
      throw new TypeError('name должно быть строкой');
    }
    if (typeof id !== 'number' || !Number.isInteger(id)) {
      throw new TypeError('id должно быть целым числом');
    }
    
    this.name = name;
    this.id = id;
  }
  
  // Метод для преобразования в JSON (аналог .dict() в Pydantic)
  toJSON() {
    return {
      name: this.name,
      id: this.id
    };
  }
}

/**
 * Класс UserWithAge - аналог Pydantic модели из задания 1.5
 * 
 * В Python:
 * class User(BaseModel):
 *     name: str
 *     age: int
 */
class UserWithAge {
  constructor(name, age) {
    if (typeof name !== 'string') {
      throw new TypeError('name должно быть строкой');
    }
    if (typeof age !== 'number' || !Number.isInteger(age) || age < 0) {
      throw new TypeError('age должно быть положительным целым числом');
    }
    
    this.name = name;
    this.age = age;
  }
  
  // Проверка на совершеннолетие
  isAdult() {
    return this.age >= 18;
  }
  
  toJSON() {
    return {
      name: this.name,
      age: this.age,
      is_adult: this.isAdult()
    };
  }
}

/**
 * Класс Feedback - аналог Pydantic модели из заданий 2.1 и 2.2
 * 
 * В Python:
 * class Feedback(BaseModel):
 *     name: str = Field(min_length=2, max_length=50)
 *     message: str = Field(min_length=10, max_length=500)
 */
class Feedback {
  constructor(name, message) {
    // Валидация длины
    if (typeof name !== 'string' || name.length < 2 || name.length > 50) {
      throw new Error('name должно быть строкой от 2 до 50 символов');
    }
    if (typeof message !== 'string' || message.length < 10 || message.length > 500) {
      throw new Error('message должно быть строкой от 10 до 500 символов');
    }
    
    // Проверка на недопустимые слова
    const forbiddenWords = ['кринж', 'рофл', 'вайб'];
    const messageLower = message.toLowerCase();
    
    for (const word of forbiddenWords) {
      if (messageLower.includes(word)) {
        throw new Error('Использование недопустимых слов');
      }
    }
    
    this.name = name;
    this.message = message;
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message
    };
  }
}

// Экспорт моделей
module.exports = {
  User,
  UserWithAge,
  Feedback
};
