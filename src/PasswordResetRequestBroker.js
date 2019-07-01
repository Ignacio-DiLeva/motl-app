'use strict'
let config = require('./config');
let db = require('./DatabaseBroker');
let login = require("./LoginBroker");
let email = require("./EMailBroker");
let time = require("./TimeBroker");
let randomstring = require("randomstring");

class PasswordResetRequestBroker{
  constructor(db){
    this.db = db;
  }

  requestReset(user){
    return new Promise((resolve, reject) => {
      login.returnUserData(user).then(
        (data) => {
          let reset_id = data.password_reset_id;
          let code = this.generateCode();
          let unixTime = time.getUnixTime();
          if(reset_id === config.emptyPasswordReset){
            this.db.query("INSERT INTO password_reset (code, timestamp) VALUES ('" + code + "'," + unixTime + ")").then(
              () => {
                email.sendMail(data.email, config.passwordResetMailSubject, config.passwordResetMailBody + code,null);
                resolve("SUCCESS");
              },
              (err) => {reject(err);}
            );
          }
          else{
            this.db.query("UPDATE password_reset set (code, timestamp) VALUES ('" + code + "'," + unixTime + ") WHERE id = " + reset_id.toString()).then(
              () => {
                email.sendMail(data.email, config.passwordResetMailSubject, config.passwordResetMailBody + code,null)
                resolve("SUCCESS");
              },
              (err) => {reject(err);}
            );
          }
        },
        () => {reject("ERROR_USER_NOT_FOUND");}
      );
    });
  }

  generateCode(){
    return randomstring.generate({
      length: 16,
      charset: 'alphanumeric'
    });
  }
}

module.exports = new PasswordResetRequestBroker(db);