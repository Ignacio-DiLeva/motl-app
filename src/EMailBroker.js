'use strict'
let config = require('./config');
let nodemailer = require('nodemailer');

class EMailBroker{
  constructor(){
  }

  sendMail(destination, subject, body, attachments){
    return new Promise((resolve, reject) => {
      let mailOptions = {
        from: 'ort_motl_app@gmail.com',
        to: destination,
        subject: subject,
        html: body,
        };
        config.mailTransporter.sendMail(mailOptions, (err, info) => {
          if(err) reject(err);
          resolve("SUCCESS");
        });
    });
  }
}

module.exports = new EMailBroker();