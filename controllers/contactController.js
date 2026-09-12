const { successResponse, errorResponse } = require("../utils/responseHelper");
const { sendContactEnquiryEmail } = require("../utils/emailService");

exports.sendMessage = async (req, res) => {
  const { name, email, message, subject } = req.body;
  if (!name || !email || !message) {
    return errorResponse(res, "Name, email, and message are required.", null, 400);
  }

  try {
    await sendContactEnquiryEmail({ name, email, subject, message });
    return successResponse(res, "Message sent successfully.");
  } catch (error) {
    return errorResponse(res, "Failed to send message. Please try again.", error, 500);
  }
};
