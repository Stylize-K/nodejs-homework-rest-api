// Функція, що надає помилкам валідації Mongoose статус 400
const handleMongooseError = (error, data, next) => {
  error.status = 400;
  next();
};

module.exports = handleMongooseError;
