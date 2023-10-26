const nodemailer = require("nodemailer");
require("dotenv").config();

const { META_PASSWORD } = process.env;

// Конфігурація для роботи nodemailer
const nodemailerConfig = {
  host: "smtp.meta.ua",
  port: 465,
  secure: true,
  auth: {
    user: "lysenko_ko@meta.ua",
    pass: META_PASSWORD,
  },
};

// Створюємо transport nodemailer на основі конфігурації
const transport = nodemailer.createTransport(nodemailerConfig);

// Універсальна функці sendEmail - отримує об'єкт data (email одержувача, тема листа та вміст), дописує відправника та відправляє email
const sendEmail = async (data) => {
  const email = { ...data, from: "lysenko_ko@meta.ua" };
  await transport.sendMail(email);
  return true;
};

module.exports = sendEmail;
