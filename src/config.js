"use strict";
let nodemailer = require('nodemailer');
let fs = require("fs");

var config = {};

config.dp_image_loc = "files/default_profile_image.jpg";

config.default_profile_image = fs.readFileSync(config.dp_image_loc);

config.calendar_loc = "files/default_calendar.json";

config.default_calendar = fs.readFileSync(config.calendar_loc);

config.connData = {
  user: 'postgres',
  host: 'db.ortenmarcha.ml',
  database: 'ort_motl_app',
  password: '43442476postgres',
  port: 5432,
};

config.permissions = {
  USER: 0,
  ADMIN: 1
}

config.mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ort.motl.app@gmail.com',
    pass: '43442476motlapp'
  }
});

config.secsInDay = 86400;

config.cookieConfig = {
  maxAge: 1000 * config.secsInDay,
  httpOnly: true,
  signed: true,
  secure: true
}

config.bucketName = 'downloads.ortenmarcha.ml'

config.cookieSecret = "AN9tl1xPQ06mM2Yc"

config.emptyPasswordReset = 0;

config.passwordResetMailSubject = 'Password reset for MOTL_APP'

config.passwordResetMailBody = 'Your code is: '

config.hashRounds = 12;

config.strRegex = /[a-zA-Z0-9_\-\. ]*/;
config.strRegexFull = new RegExp("^" + config.strRegex.source + "$");
config.strNoSpacesRegex = /[a-zA-Z0-9_\-\.]+/;
config.strNoSpacesRegexFull = /^[a-zA-Z0-9_\-\.]+$/;
config.emailRegex = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
config.emailRegexFull = new RegExp("^" + config.emailRegex.source + "$");
config.phoneRegex = /\+?[0-9]+/
config.phoneRegexFull = new RegExp("^" + config.phoneRegex.source + "$");

module.exports = config;