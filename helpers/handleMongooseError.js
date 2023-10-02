// Функція, що надає помилкам валідації Mongoose статус 400
const handleMongooseError = (error, data, next) => {
  const { name, code } = error;
  // Вказуємо 409 помилку при дублюванні унікальних полів (для email), у всіх інших випадках - 400-та помилка
  const status = name === "MongoServerError" && code === 11000 ? 409 : 400;
  error.status = status;
  next();
};

module.exports = handleMongooseError;
