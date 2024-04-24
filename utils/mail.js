import nodemailer from 'nodemailer';

const sendMail = async (userEmail, firstName, userMessage) => {
  const transporter = nodemailer.createTransport({
    service: process.env.SERVICE,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });
  const info = await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: userEmail,
    subject: 'Welcome to Chitchat ',
    text: `Hi ${firstName}`,
    html: userMessage,
  });
};

export { sendMail };
