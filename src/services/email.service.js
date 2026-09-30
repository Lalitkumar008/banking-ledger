require("dotenv").config();
const nodemailer = require("nodemailer");

// interacts with google's smtp server from our server
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

module.exports = transporter;

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Your Name" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const text = "welcome to be-ledger!";
  const subject = "Welcome email";
  const html = `<p>hello,welcome here</p>`;
  await sendEmail(userEmail, subject, text, html);
}
async function sendTransactionSuccessEmail(userEmail, name, amount, toAccount) {
  const text = "welcome to be-ledger!";
  const subject = "Transaction Succesful";
  const html = `<p>${name}</p> , your transaction of amount ${amount} to ${toAccount} is successful`;
  await sendEmail(userEmail, subject, text, html);
}
async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const text = "welcome to be-ledger!";
  const subject = "Transaction Succesful";
  const html = `<p>${name}</p> , your transaction of amount ${amount} to ${toAccount} is successful`;
  await sendEmail(userEmail, subject, text, html);
}

module.exports = {
  sendRegistrationEmail,
  sendTransactionSuccessEmail,
  sendTransactionFailureEmail,
};
