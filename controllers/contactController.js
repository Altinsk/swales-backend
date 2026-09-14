const { successResponse, errorResponse } = require("../utils/responseHelper");
const { sendContactEnquiryEmail } = require("../utils/emailService");

// Basic sanity check, not full RFC 5322 validation - just enough to reject
// garbage input and, more importantly, anything containing a line break.
// `email`/`subject` flow into emailService.js as the outbound email's
// `replyTo`/`subject` fields (real header-like fields, unlike the message
// body which is HTML-escaped) - a CR/LF in either could otherwise attempt
// header injection, even though Resend's structured JSON API likely
// strips/rejects control characters on its own.
const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.sendMessage = async (req, res) => {
  const { name, email, message, subject } = req.body;
  if (!name || !email || !message) {
    return errorResponse(res, "Name, email, and message are required.", null, 400);
  }
  if (typeof email !== "string" || /[\r\n]/.test(email) || !EMAIL_FORMAT_REGEX.test(email)) {
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
