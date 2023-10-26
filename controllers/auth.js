const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const jimp = require("jimp");
const { nanoid } = require("nanoid");

const { User } = require("../models/user");
const { HttpError, ctrlWrapper, sendEmail } = require("../helpers");
const { userSubscriptionEnum } = require("../constants");

const { SECRET_KEY, BASE_URL } = process.env;

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

// Контроллер реєстрації користувача
const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }
  // Виконуємо хешування пароля користувача перед збереженням у DB (за допомогою bcrypt)
  const hashPassword = await bcrypt.hash(password, 10);

  // Генеруємо унікальний аватар юзера по email та повертаємо URL аватара (пакет gravatar)
  const avatarURL = gravatar.url(email);

  // Генеруємо токен верифікації
  const verificationToken = nanoid();

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  const verifyEmail = {
    to: email,
    sunject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">Click verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

// Контроллер верифікації нового користувача
const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw HttpError(404, "User not found");
  }
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: "",
  });

  res.status(200).json({
    message: "Verification successful",
  });
};

// Контроллер повторного надсилання листа для верифікації нового користувача
const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email not found");
  }
  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email,
    sunject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/users/verify/${user.verificationToken}">Click verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(200).json({
    message: "Verification email sent",
  });
};

// Контроллер логінізації користувача
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  if (!user.verify) {
    throw HttpError(401, "Email not verified");
  }
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }
  // Використаємо _id користувача в payload для створення jwt-токена
  const payload = {
    id: user._id,
  };
  // Створюємо jwt-токен для користувача
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

// Контроллер підтвердження поточного користувача (current)
const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription,
  });
};

// Контроллер логауту поточного користувача (logout)
const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.status(204).json();
};

// Оновлення підписки користувача (subscription)
const updateUserSubscription = async (req, res) => {
  const { subscription } = req.body;
  if (!Object.values(userSubscriptionEnum).includes(subscription)) {
    throw new HttpError(400, "Invalid subscription value");
  }

  const { _id } = req.user;

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    { subscription },
    { new: true }
  );

  if (!updatedUser) {
    throw new HttpError(404, "User not found");
  }

  res.status(200).json(updatedUser);
};

// Оновлення аватара користувача (updateAvatar)
const updateAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;
  const filename = `${_id}_${originalname}`; // Робимо унікальним ім'я файлу, дадаючи id на початок імені
  const resultUpload = path.join(avatarsDir, filename);

  // Зменшуємо аватар до 250х250 за допомогою пакета jimp
  const avatar = await jimp.read(tempUpload);
  await avatar
    .resize(250, 250, jimp.RESIZE_BEZIER)
    .normalize()
    .quality(50)
    .writeAsync(tempUpload);

  // Переносимо оброблений аватар з папки temp до папки public/avatars
  await fs.rename(tempUpload, resultUpload);
  const avatarURL = path.join("avatars", filename);
  await User.findByIdAndUpdate(_id, { avatarURL });

  res.json({ avatarURL });
};

// Експортуємо контроллери, огорнуті у ctrlWrapper (Функція-декоратор, що огортає в try..catch кожен контроллер)
module.exports = {
  register: ctrlWrapper(register),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateUserSubscription: ctrlWrapper(updateUserSubscription),
  updateAvatar: ctrlWrapper(updateAvatar),
};
