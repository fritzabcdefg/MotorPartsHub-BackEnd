const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendActivationEmail = async (email, token) => {
    // The link hits the backend verification endpoint directly
    const activationLink = `http://localhost:4000/api/v1/verify-email?token=${token}`;

    const htmlContent = `
    <div style="background-color: #05020a; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #090314; border: 1px solid rgba(168, 107, 255, 0.3); border-radius: 12px; padding: 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7);">
            <h1 style="color: #a86bff; margin-top: 0; font-size: 1.8rem; border-bottom: 1px solid rgba(168, 107, 255, 0.15); padding-bottom: 16px;">MotorPartsHub</h1>
            <p style="font-size: 1.05rem; color: #b3a1d9; line-height: 1.6;">Thank you for creating an account with us! Please verify your email to unlock your account and finalize your customer profile setup.</p>
            <div style="margin: 32px 0;">
                <a href="${activationLink}" style="background-color: #a86bff; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: bold; border-radius: 6px; box-shadow: 0 4px 14px rgba(168, 107, 255, 0.4); display: inline-block; transition: all 0.2s;">
                    Activate My Account
                </a>
            </div>
            <p style="font-size: 0.85rem; color: #665588; margin-bottom: 0;">If the button above doesn't work, copy and paste this URL into your browser:<br>
            <a href="${activationLink}" style="color: #a86bff; word-break: break-all;">${activationLink}</a></p>
        </div>
    </div>
    `;

    await transporter.sendMail({
        from: '"MotorPartsHub Verification" <noreply@motorpartshub.com>',
        to: email,
        subject: 'Activate Your MotorPartsHub Account',
        html: htmlContent
    });
};

module.exports = { sendActivationEmail };