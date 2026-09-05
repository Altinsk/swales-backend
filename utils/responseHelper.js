module.exports = {
  successResponse: (res, message, data = {}, id) => {
    return res.status(200).json({
      success: true,
      message,
      data,
      error: null,
      userId: id,
    });
  },

  errorResponse: (res, message, error = null, statusCode = 400) => {
    // `error` is logged server-side only, never sent to the client. Confirmed
    // live 2026-09-05: a raw Sequelize validation error (e.g. from
    // register()'s User.create call) serializes its `errors[].instance` -
    // the full model instance being validated, INCLUDING PasswordHash and
    // PasswordSalt if they were already set on it - so passing the raw
    // error straight through to `res.json()` handed a client the bcrypt
    // hash and salt for whatever password was just submitted, on any
    // validation failure. No frontend in either swales-designer or
    // swales-services actually reads this field (checked - both only ever
    // use `message`), so there's no behavior to preserve by keeping it.
    if (error) {
      console.error(message, error);
    }
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      error: null,
    });
  },
};
