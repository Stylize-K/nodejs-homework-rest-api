const express = require("express");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();

const authRouter = require("./routes/api/auth");
const contactsRouter = require("./routes/api/contacts");

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // мідлвара, яка дозволяє при запиті статичних файлів, шукати та віддавати їх тільки з папки public. За замовченням, при запиті файлів сервер нічого не віддає.

// Підключення роутера для реєстрації/авторизації користувачів
app.use("/users", authRouter);

// Підключення роутера для доступу до контактів
app.use("/api/contacts", contactsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;
  res.status(status).json({ message });
});

module.exports = app;
