import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const wrap = (title, body) => `
  <div style="font-family:Georgia,serif;max-width:560px;margin:auto;background:#fdf4ff;border-radius:16px;overflow:hidden;border:1px solid #f0abfc">
    <div style="background:linear-gradient(135deg,#4a044e,#a21caf);padding:28px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px">BookHaven</h1>
    </div>
    <div style="padding:28px;color:#3b0764">
      <h2 style="color:#86198f;margin-top:0">${title}</h2>
      ${body}
    </div>
    <div style="padding:18px;text-align:center;background:#fae8ff;color:#86198f;font-size:12px">
      © ${new Date().getFullYear()} BookHaven. All rights reserved.
    </div>
  </div>`;

/**
 * Generic send helper.
 * @param {{to:string, subject:string, html?:string, text?:string}} opts
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_HOST) {
    console.warn('⚠️  SMTP not configured — skipping email to', to);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};

export const templates = {
  welcome: (name) =>
    wrap('Welcome to BookHaven 📚', `<p>Hi ${name},</p><p>Thanks for joining BookHaven — your destination for exclusive and unforgettable stories. Happy reading!</p>`),

  resetPassword: (name, url) =>
    wrap(
      'Reset your password',
      `<p>Hi ${name},</p><p>You requested a password reset. This link expires in 15 minutes.</p>
       <p style="text-align:center;margin:24px 0">
         <a href="${url}" style="background:#a21caf;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none">Reset Password</a>
       </p>
       <p style="font-size:12px;color:#a855f7">If you didn't request this, you can safely ignore this email.</p>`
    ),

  orderConfirmation: (name, order) =>
    wrap(
      'Order confirmed 🎉',
      `<p>Hi ${name},</p><p>Your order <strong>#${order._id}</strong> has been received.</p>
       <p>Total: <strong>$${order.totalPrice.toFixed(2)}</strong></p>
       <p>We'll email you again when it ships.</p>`
    ),

  orderStatus: (name, order) =>
    wrap(
      `Order ${order.orderStatus}`,
      `<p>Hi ${name},</p><p>Your order <strong>#${order._id}</strong> is now <strong>${order.orderStatus}</strong>.</p>`
    ),

  newsletter: (subject, content) => wrap(subject, content),
};
