const { Schema, model } = require("mongoose");
const { handleMongooseError } = require("../helpers");
const Joi = require("joi");
const { userSubscriptionEnum } = require("../constants");

const userSchema = new Schema(
  {
    password: {
      type: String,
      required: [true, "Set password for user"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    subscription: {
      type: String,
      enum: ["starter", "pro", "business"],
      default: "starter",
    },
    token: String,
  },
  { versionKey: false, timestamps: true }
);

// Надаємо статус 400 помилці валідації Mongoose, адже по дефолту методи Mongoose викидають помилки без статусу і вони прокидуються в кінці зі статусом 500
userSchema.post("save", handleMongooseError);

const registerSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "ua"] } })
    .required()
    .messages({
      "any.required": "missing required email field",
    }),
  password: Joi.string().required().messages({
    "any.required": "missing required password field",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "ua"] } })
    .required()
    .messages({
      "any.required": "missing required email field",
    }),
  password: Joi.string().required().messages({
    "any.required": "missing required password field",
  }),
});

const updateSubscriptionSchema = Joi.object({
  subscription: Joi.string()
    .valid(...Object.values(userSubscriptionEnum))
    .required()
    .messages({
      "any.required": "missing required subscription field",
    }),
});

const schemas = {
  registerSchema,
  loginSchema,
  updateSubscriptionSchema,
};

const User = model("user", userSchema);

module.exports = { User, schemas };
