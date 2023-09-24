const { isValidObjectId } = require("mongoose");
const { HttpError } = require("../helpers");

// Мідлвара, що перевіряє ID на валідність
const isValidId = (req, res, next) => {
  const { contactId } = req.params;
  if (!isValidObjectId(contactId)) {
    next(HttpError(400, `${contactId} is not valid ID`));
  }
  next();
};

module.exports = isValidId;
