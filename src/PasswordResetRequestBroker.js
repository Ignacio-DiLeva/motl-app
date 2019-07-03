'use strict'
let config = require('./config');
let db = require('./DatabaseBroker');
let email = require("./EMailBroker");
let time = require("./TimeBroker");
let randomstring = require("randomstring");

class PasswordResetRequestBroker{
  constructor(db){
    this.db = db;
  }

  requestReset(user){
    return new Promise((resolve, reject) => {
      this.db.returnUserData(user).then(
        (data) => {
          let reset_id = parseInt(data.password_reset_id);
          let code = this.generateCode();
          let unixTime = time.getUnixTime() + config.secsInDay;
          if(reset_id === config.emptyPasswordReset){
            this.db.query("INSERT INTO password_reset (code, timestamp) VALUES ('" + code + "'," + unixTime + ") RETURNING id").then(
              (insert_result) => {
                this.db.query("UPDATE users SET password_reset_id = " + insert_result.rows[0].id + "WHERE id = " + data.id).then(
                  () => {
                    email.sendMail(data.email, config.passwordResetMailSubject, config.passwordResetMailBody + code,null)
                    resolve("SUCCESS");
                  },
                  (err) => {reject(err);}
                );
              },
              (err) => {reject(err);}
            );
          }
          else{
            this.db.query("UPDATE password_reset SET code = " + code + ", timestamp = " + unixTime + " WHERE id = ").then(
              () => {
                email.sendMail(data.email, config.passwordResetMailSubject, config.passwordResetMailBody + code,null);
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