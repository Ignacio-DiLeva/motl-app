'use strict'
let config = require('./config');
let nodemailer = require('nodemailer');

class EMailBroker{
    constructor(){

    }

    sendMail(destination, subject, body, attachments){
        return new Promise((resolve, reject) => {
            reject("TODO");
        })
    }
}

module.exports = new EMailBroker();