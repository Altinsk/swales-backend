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
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      error,
    });
  },
};
