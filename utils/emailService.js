const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
  port: process.env.EMAIL_PORT || 2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ─────────────────────────────────────────
// ACTIVATION EMAIL (unchanged)
// ─────────────────────────────────────────
const sendActivationEmail = async (email, token) => {
  const activationLink = `http://localhost:4000/api/v1/verify-email?token=${token}`;

  const htmlContent = `
  <div style="background-color: #05020a; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; text-align: center;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #090314; border: 1px solid rgba(168, 107, 255, 0.3); border-radius: 12px; padding: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);">
      <h1 style="color: #a86bff; margin-top: 0; font-size: 1.8rem; border-bottom: 1px solid rgba(168, 107, 255, 0.15); padding-bottom: 16px;">MotorPartsHub</h1>
      <p style="font-size: 1.05rem; color: #b3a1d9; line-height: 1.6;">Thank you for creating an account with us! Please verify your email to unlock your account and finalize your customer profile setup.</p>
      <div style="margin: 32px 0;">
        <a href="${activationLink}" style="background-color: #a86bff; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: bold; border-radius: 6px; box-shadow: 0 4px 14px rgba(168, 107, 255, 0.4); display: inline-block;">
          Activate My Account
        </a>
      </div>
      <p style="font-size: 0.85rem; color: #665588; margin-bottom: 0;">If the button doesn't work, copy and paste this URL:<br>
      <a href="${activationLink}" style="color: #a86bff; word-break: break-all;">${activationLink}</a></p>
    </div>
  </div>`;

  await transporter.sendMail({
    from:    '"MotorPartsHub Verification" <noreply@motorpartshub.com>',
    to:      email,
    subject: 'Activate Your MotorPartsHub Account',
    html:    htmlContent
  });
};

// ─────────────────────────────────────────
// ORDER RECEIPT EMAIL — ADDED
// ─────────────────────────────────────────
const sendOrderReceiptEmail = async ({ email, fname, lname, phone, zipcode, items, itemsTotal, shipping, total, address }) => {

  // Build itemized rows for the email table
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 10px 8px; border-bottom: 1px solid rgba(168,107,255,0.1); color: #ffffff;">
        ${item.name || 'Item'}
      </td>
      <td style="padding: 10px 8px; border-bottom: 1px solid rgba(168,107,255,0.1); color: #b3a1d9; text-align: center;">
        x${item.quantity || 1}
      </td>
      <td style="padding: 10px 8px; border-bottom: 1px solid rgba(168,107,255,0.1); color: #a86bff; text-align: right; font-weight: 700;">
        ₱${(parseFloat(item.price || 0) * parseInt(item.quantity || 1)).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
  <div style="background-color: #05020a; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; padding: 40px;">
    <div style="max-width: 560px; margin: 0 auto; background-color: #090314; border: 1px solid rgba(168, 107, 255, 0.3); border-radius: 12px; padding: 36px; box-shadow: 0 8px 32px rgba(0,0,0,0.7);">
      
      <!-- Header -->
      <h1 style="color: #a86bff; margin-top: 0; font-size: 1.8rem; text-align: center; border-bottom: 1px solid rgba(168,107,255,0.15); padding-bottom: 16px;">
        MotorPartsHub
      </h1>

      <!-- Confirmation -->
      <div style="text-align: center; margin-bottom: 28px;">
        <span style="font-size: 2.5rem;">🎉</span>
        <h2 style="color: #ffffff; margin: 8px 0 4px;">Order Confirmed!</h2>
        <p style="color: #b3a1d9; margin: 0;">Hi ${fname}, thank you for your order.</p>
      </div>

      <!-- Items Table -->
      <h3 style="color: #a86bff; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Items Ordered
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <thead>
          <tr>
            <th style="padding: 8px; text-align: left; color: #665588; font-size: 0.8rem; text-transform: uppercase; border-bottom: 1px solid rgba(168,107,255,0.2);">Item</th>
            <th style="padding: 8px; text-align: center; color: #665588; font-size: 0.8rem; text-transform: uppercase; border-bottom: 1px solid rgba(168,107,255,0.2);">Qty</th>
            <th style="padding: 8px; text-align: right; color: #665588; font-size: 0.8rem; text-transform: uppercase; border-bottom: 1px solid rgba(168,107,255,0.2);">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <!-- Subtotal + Shipping -->
      <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem;">
        <span style="color: #b3a1d9;">Subtotal</span>
        <span style="color: #ffffff;">₱${parseFloat(itemsTotal || 0).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem;">
        <span style="color: #b3a1d9;">Shipping Fee</span>
        <span style="color: #ffffff;">₱${parseFloat(shipping || 0).toFixed(2)}</span>
      </div>

      <!-- Total -->
      <div style="display: flex; justify-content: space-between; padding: 14px 0; border-top: 2px solid rgba(168,107,255,0.25); margin-bottom: 24px;">
        <span style="color: #ffffff; font-weight: 700; font-size: 1rem;">Total</span>
        <span style="color: #a86bff; font-weight: 800; font-size: 1.2rem;">₱${parseFloat(total).toFixed(2)}</span>
      </div>

      <!-- Shipping Info -->
      <h3 style="color: #a86bff; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
        Shipping To
      </h3>
      <p style="color: #b3a1d9; margin: 0 0 6px;">
        <strong style="color: #ffffff;">${fname} ${lname}</strong>
      </p>
      <p style="color: #b3a1d9; margin: 0 0 6px;">${address}</p>
      <p style="color: #b3a1d9; margin: 0 0 24px;">
        📞 ${phone || 'N/A'} &nbsp;|&nbsp; Zip: ${zipcode || 'N/A'}
      </p>

      <!-- Payment -->
      <div style="background: rgba(40,167,69,0.08); border: 1px solid rgba(40,167,69,0.25); border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
        <span style="color: #28a745; font-weight: 700;">✅ Payment Method: Cash on Delivery</span><br>
        <span style="color: #b3a1d9; font-size: 0.85rem;">You will pay when your order arrives at your door.</span>
      </div>

      <!-- Footer -->
      <p style="text-align: center; color: #665588; font-size: 0.8rem; margin: 0;">
        Thank you for shopping with MotorPartsHub!<br>
        Questions? Reply to this email.
      </p>

    </div>
  </div>`;

  await transporter.sendMail({
    from:    '"MotorPartsHub Orders" <orders@motorpartshub.com>',
    to:      email,
    subject: `Order Confirmed — MotorPartsHub`,
    html:    htmlContent
  });
};

module.exports = { sendActivationEmail, sendOrderReceiptEmail };