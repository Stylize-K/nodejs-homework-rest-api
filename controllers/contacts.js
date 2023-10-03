const { Contact } = require("../models/contact");
const { HttpError, ctrlWrapper } = require("../helpers");

// Отримання списку всіх контактів з DB
const listContacts = async (req, res, next) => {
  const { _id: owner } = req.user;
  // Пагінація
  const { page = 1, limit = 20, favorite } = req.query;
  const skip = (page - 1) * limit;

  // Фільтрація контактів по полю обраного (GET /contacts?favorite=true)
  const filter = { owner, favorite: favorite === "true" };

  const result = await Contact.find(filter, "-createdAt -updatedAt", {
    skip,
    limit,
  }).populate("owner", "email");
  res.json(result);
};

// Отримання контакту по ID з DB
const getContactById = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await Contact.findById(contactId);
  if (!result) {
    throw HttpError(404, "Not found");
  }
  res.json(result);
};

// Додавання контакту в DB
const addContact = async (req, res, next) => {
  // Кожний доданий контакт буде закріплений за конкретним користувачем. Користувач зможе мати доступ тільки до своїх контактів.
  const { _id: owner } = req.user;
  const result = await Contact.create({ ...req.body, owner });
  res.status(201).json(result);
};

// Оновлення контакту в DB
const updateContact = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await Contact.findByIdAndUpdate(contactId, req.body, {
    new: true,
  });
  if (!result) {
    throw HttpError(404, "Not found");
  }
  res.json(result);
};

// Оновлення статусу контакту в  DB (значення favorite)
const updateStatusContact = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await Contact.findByIdAndUpdate(contactId, req.body, {
    new: true,
  });
  if (!result) {
    throw HttpError(404, "Not found");
  }
  res.json(result);
};

// Видалення контакту по ID з DB
const removeContact = async (req, res, next) => {
  const { contactId } = req.params;
  const result = await Contact.findByIdAndRemove(contactId);
  if (!result) {
    throw HttpError(404, "Not found");
  }
  res.json({ message: "contact deleted" });
};

// Експортуємо контроллери, огорнуті у ctrlWrapper (Функція-декоратор, що огортає в try..catch кожен контроллер)

module.exports = {
  listContacts: ctrlWrapper(listContacts),
  getContactById: ctrlWrapper(getContactById),
  addContact: ctrlWrapper(addContact),
  updateContact: ctrlWrapper(updateContact),
  updateStatusContact: ctrlWrapper(updateStatusContact),
  removeContact: ctrlWrapper(removeContact),
};
