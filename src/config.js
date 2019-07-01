'use strict'

var config = {};

config.connData = {
  user: 'postgres',
  host: 'ort-motl-app.cwihmzkvtujm.us-east-1.rds.amazonaws.com',
  database: 'ort_motl_app',
  password: '43442476postgres',
  port: 5432,
};

config.permissions = {
  USER: "",
  ADMIN: ""
}

config.emptyPasswordReset = 0;

config.passwordResetMailSubject = 'Password reset for MOTL_APP'

config.passwordResetMailBody = 'Your code is: '

config.hashRounds = 12;

config.strRegex = /[a-zA-Z0-9_\-\. ]+/;
config.strRegexFull = new RegExp("^" + config.strRegex + "$");
config.strNoSpacesRegex = /[a-zA-Z0-9_\-\.]+/;
config.strNoSpacesRegexFull = /^[a-zA-Z0-9_\-\.]+$/;
config.emailRegex = new RegExp(config.strNoSpacesRegex.source + "@" + config.strNoSpacesRegex.source + "(\." + config.strNoSpacesRegex.source + ")*");
config.emailRegexFull = new RegExp("^" + config.emailRegex + "$");
config.phoneRegex = /\+?[0-9]+/
config.phoneRegexFull = new RegExp("^" + config.phoneRegex + "$");

module.exports = config;