const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user");
const { HttpError, ctrlWrapper } = require("../helpers");
const { userSubscriptionEnum } = require("../constants");

const { SECRET_KEY } = process.env;

// Контроллер реєстрації користувача
const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }
  // Виконуємо хешування пароля користувача перед збереженням у DB (за допомогою bcrypt)
  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({ ...req.body, password: hashPassword });

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

// Контроллер логінізації користувача
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
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

// Експортуємо контроллери, огорнуті у ctrlWrapper (Функція-декоратор, що огортає в try..catch кожен контроллер)
module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateUserSubscription: ctrlWrapper(updateUserSubscription),
};
