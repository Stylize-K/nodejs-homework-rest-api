const { HttpError } = require("../helpers");

// Мідлвара, що перевіряє тіло body
const validateBody = (schema) => {
  const func = (req, res, next) => {
    // Перевірка на відсутність всіх полів у body
    if (!Object.keys(req.body).length) {
      // Якщо body пустий і це HTTP-метод PATCH - то повертаємо 400-ту помилку і missing field favorite
      if (req.method === "PATCH") {
        next(HttpError(400, "missing field favorite"));
      }
      next(HttpError(400, "missing fields"));
    }
    const { error } = schema.validate(req.body);
    if (error) {
      next(HttpError(400, error.message));
    }
    next();
  };
  return func;
};

module.exports = validateBody;
