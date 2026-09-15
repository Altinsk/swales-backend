const { successResponse, errorResponse } = require("../utils/responseHelper");
const { sendContactEnquiryEmail } = require("../utils/emailService");
const { isValidEmailFormat } = require("../utils/emailFormat");

exports.sendMessage = async (req, res) => {
  const { name, email, message, subject } = req.body;
  if (!name || !email || !message) {
    return errorResponse(res, "Name, email, and message are required.", null, 400);
  }
  // email/subject flow into emailService.js as the outbound email's real
  // replyTo/subject fields (unlike the message body, which is HTML-escaped)
  // - reject a malformed address or an embedded line break before either
  // reaches those header-like fields.
  if (!isValidEmailFormat(email)) {
    return errorResponse(res, "Please enter a valid email address.", null, 400);
  }
  if (typeof subject === "string" && /[\r\n]/.test(subject)) {
    return errorResponse(res, "Subject can't contain line breaks.", null, 400);
  }

  try {
    await sendContactEnquiryEmail({ name, email, subject, message });
    return successResponse(res, "Message sent successfully.");
  } catch (error) {
    return errorResponse(res, "Failed to send message. Please try again.", error, 500);
  }
};
