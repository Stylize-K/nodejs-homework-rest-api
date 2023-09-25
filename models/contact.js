const { Schema, model } = require("mongoose");
const { handleMongooseError } = require("../helpers");
const Joi = require("joi");

// Схема валідації для Mongoose (валідація даних перед збереженням в db)
const contactSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Set name for contact"],
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false }
);

// Надаємо статус 400 помилці валідації Mongoose, адже по дефолту методи Mongoose викидають помилки без статусу і вони прокидуються в кінці зі статусом 500
contactSchema.post("save", handleMongooseError);

// Схема валідація для Joi (валідація даних в тілі запиту). Використовуємо валідацію Joi, щоб уникнути зайвих підключень до DB
const addSchema = Joi.object({
  name: Joi.string()
    .required()
    .messages({ "any.required": "missing required name field" }),
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "ua"] } })
    .required()
    .messages({
      "any.required": "missing required email field",
      "string.email": "invalid email",
    }),
  phone: Joi.string()
    .required()
    .messages({ "any.required": "missing required phone field" }),
  favorite: Joi.boolean(),
});

// Схема валідація для Joi при оновленні статусу контакту favorite
const updateFavoriteSchema = Joi.object({
  favorite: Joi.boolean().required(),
});

const schemas = {
  addSchema,
  updateFavoriteSchema,
};

const Contact = model("contact", contactSchema);

module.exports = { Contact, schemas };
