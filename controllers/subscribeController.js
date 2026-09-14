const { successResponse, errorResponse } = require("../utils/responseHelper");
const { Subscriber } = require("../models");
const normalizeEmail = require("../utils/normalizeEmail");

exports.subscribeEmail = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) {
    return errorResponse(res, "Email is required.", null, 400);
  }

  try {
    // Re-subscribing an already-subscribed email isn't a real error from
    // the visitor's side - findOrCreate makes this idempotent instead of
    // surfacing a unique-constraint violation.
    await Subscriber.findOrCreate({ where: { Email: email } });
    return successResponse(res, "Subscribed successfully!");
  } catch (error) {
    return errorResponse(res, "Failed to subscribe. Please try again.", error, 500);
  }
};
