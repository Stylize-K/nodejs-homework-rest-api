const express = require("express");

const ctrl = require("../../controllers/auth");
const { validateBody, authenticate } = require("../../middlewares");

const { schemas } = require("../../models/user");

const router = express.Router();

// Реєстрація юзера (sign up)
router.post("/register", validateBody(schemas.registerSchema), ctrl.register);
// Логінізація юзера (sign in)
router.post("/login", validateBody(schemas.loginSchema), ctrl.login);
// Підтвердження поточного користувача (current)
router.get("/current", authenticate, ctrl.getCurrent);
// Логаут користувача (log out)
router.post("/logout", authenticate, ctrl.logout);
// Оновлення підписки користувача (update subscription)
router.patch(
  "/",
  authenticate,
  validateBody(schemas.updateSubscriptionSchema),
  ctrl.updateUserSubscription
);

module.exports = router;
