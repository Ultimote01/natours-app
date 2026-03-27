const nodeMailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.fristName = user.name.split(' ')[0];
    this.url = url;
    this.from = `${process.env.SENDGRID_FROM}`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "prod") {
      // 🚀  Real emails
      return nodeMailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
  
    // 🧪  Captured by Ethereal
    return nodeMailer.createTransport({
      host: "127.0.0.1",  // Mailcatcher SMTP
    port: 65512,
    secure: false,      // Mailcatcher does not use SSL
    auth: null,         // no username or password
    tls: {
      rejectUnauthorized: false
    }
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // 2) Define email options
     const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.htmlToText(html)
    };

    // 3) Create a transport and send email
    console.log(this.url);
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome(template) {
    await this.send(template, 'Welcome to the Natours Family!');
  }

  async sendPasswordReset(template) {
    await this.send(
      template,
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};

 

