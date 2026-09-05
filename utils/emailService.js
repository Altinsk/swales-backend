const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { Resend } = require("resend");
dotenv.config();

// Initialize Resend with env variable for security
const resend = new Resend(process.env.RESEND_API_KEY);

// --- CONFIGURATION ---
// Replace these URLs with your actual asset links
const COMPANY_NAME = "Swales";
const LOGO_URL = "https://garden-desinger.vercel.app/logo.png"; // Replace with your hosted logo
const TWITTER_URL = "https://twitter.com";
const INSTAGRAM_URL = "https://instagram.com";
const WEBSITE_URL = process.env.BASE_URL || "https://yourwebsite.com";

// --- STYLING & TEMPLATE HELPER ---
const getEmailTemplate = (heading, message, buttonText, buttonUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${heading}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #333333; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; }
        .email-card { background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background-color: #ffffffff; text-align: center; }
        .logo { max-height: 95px; }
        .content { padding: 30px 20px; }
        .h1 { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #333333; }
        .text { font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 20px; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
        .btn:hover { background-color: #0056b3; }
        .footer { text-align: center; font-size: 12px; color: #999999; margin-top: 20px; padding-bottom: 20px; }
        .social-links { margin-bottom: 10px; }
        .social-links a { color: #999999; text-decoration: none; margin: 0 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="header">
            <img src="${LOGO_URL}" alt="${COMPANY_NAME}" class="logo" style="color: white;">
          </div>
          
          <div class="content">
            <h1 class="h1">${heading}</h1>
            <p class="text">${message}</p>
            
            <div class="btn-container">
              <a href="${buttonUrl}" class="btn" style="color:white" target="_blank">${buttonText}</a>
            </div>

            <p class="text" style="font-size: 14px; color: #999;">
              If the button above doesn't work, copy and paste this link into your browser:<br>
              <a href="${buttonUrl}" style="color: #007bff;">${buttonUrl}</a>
            </p>
          </div>
        </div>

        <div class="footer">
          <div class="social-links">
            <a href="${TWITTER_URL}">Twitter</a> • 
            <a href="${INSTAGRAM_URL}">Instagram</a> • 
            <a href="${WEBSITE_URL}">Facebook</a>
          </div>
          <p>&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
      
        </div>
      </div>
    </body>
    </html>
  `;
};

// --- EXPORTED FUNCTIONS ---

exports.sendVerificationEmail = async (email, token, src = "swales") => {
  // Confirmed live 2026-09-05: when BASE_URL is unset, this template
  // literal coerces `undefined` to the literal string "undefined" - the
  // resulting "undefined/api/auth/verify-email/..." string has no
  // protocol/host, so it's a relative URL. Clicking it inside a webmail
  // preview (e.g. minuteinbox.com) silently resolves it against THAT
  // site's own current page instead of erroring, producing a link that
  // looks plausible but 404s on the wrong domain - exactly what broke a
  // real signup. Fail loudly instead of building a broken link.
  if (!process.env.BASE_URL) {
    throw new Error("BASE_URL is not configured - cannot build a verification link.");
  }
  const url = `${process.env.BASE_URL}/api/auth/verify-email/${src}/${token}`;

  const htmlContent = getEmailTemplate(
    "Verify your Email Address",
    "Welcome to Swales! Please verify your email address to get started. This link will expire in 24 hours.",
    "Verify Email",
    url
  );

  // The Resend SDK does NOT throw on an API-level rejection (bad/unauthorized
  // sender domain, invalid recipient, rate limit, etc.) - it resolves with
  // { data: null, error } instead. Callers here (register, resend-verification)
  // wrap this in a try/catch expecting a throw on failure, so without this
  // check a rejected send silently "succeeds" and the user is told to check
  // an email that was never sent. Confirmed live 2026-09-05: this exact
  // silent failure was why a real signup never received its verification
  // email - Resend returned 403 "This API key is not authorized to send
  // emails from permaculturetools.online" and the code never noticed.
  const result = await resend.emails.send({
    from: "no-reply@permaculturetools.online", // Verified in Resend 2026-09-03 for testing on the rebuild's test domain
    to: email,
    subject: "Verify your Email",
    html: htmlContent,
  });
  if (result.error) {
    throw new Error(`Failed to send verification email: ${result.error.message}`);
  }
};

exports.sendResetPasswordEmail = async (email, token, source = "swales") => {
  const url =
    source == "swales"
      ? `${process.env.SWALES_APP_URL}/reset-password?token=${token}`
      : `${process.env.DESIGNER_APP_URL}/reset-password?token=${token}`;

  const htmlContent = getEmailTemplate(
    "Reset your Password",
    "We received a request to reset your password. If you didn't make this request, you can safely ignore this email.",
    "Reset Password",
    url
  );

  // See sendVerificationEmail's comment above - the SDK resolves with an
  // { error } object rather than throwing, so this check is required for
  // a failed send to actually surface as a failure to the caller.
  const result = await resend.emails.send({
    from: "no-reply@permaculturetools.online",
    to: email,
    subject: "Reset Password",
    html: htmlContent,
  });
  if (result.error) {
    throw new Error(`Failed to send password reset email: ${result.error.message}`);
  }
};
