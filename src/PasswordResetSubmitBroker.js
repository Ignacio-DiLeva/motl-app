"use strict";
let config = require('./config');
let db = require('./DatabaseBroker');
let time = require('./TimeBroker');
let crypto = require("./CryptoBroker");
let cookieBroker = require("./CookieBroker");

class PasswordResetSubmitBroker{
  constructor(db){
    this.db = db;
  }

  submitReset(user, code, new_password){
    return new Promise((resolve, reject) => {
      if(!this.db.checkPassword(new_password))
        reject("BAD_PASSWORD");
      else{
        this.db.returnUserData(user).then(
          (data) => {
            db.query("SELECT * FROM password_reset WHERE id = " + data.password_reset_id).then(
              (result) => {
                if(result.rows[0].code !== code){
                  reject("ERROR_INCORRECT_CODE");
                }
                else if(parseInt(result.rows[0].timestamp) < time.getUnixTime()){
                  reject("ERROR_OUT_OF_TIME");
                }
                else{
                  db.query("DELETE FROM password_reset WHERE id = " + data.password_reset_id).then(
                    () => {
                      this.updatePassword(user, new_password).then(
                        () => {
                          cookieBroker.setCookie(user, null).then(
                            (cookie) => {resolve(cookie);},
                            (err) => {reject(err);}
                          );
                        },
                        (err) => {reject(err);}
                      );
                    },
                    (err) => {reject(err);}
                  );
                }
              },
              () => {reject("ERROR_USER_NOT_FOUND");}
            );
          },
          (err) => {reject(err);}
        );
      }
    });
  }

  updatePassword(user, password){
    return new Promise((resolve, reject) => {
      crypto.hash(password).then(
        (hashed) => {
          resolve(this.db.query("UPDATE users SET password = '"  + hashed + "', password_reset_id = " + config.emptyPasswordReset + "WHERE username = '" + user + "'"));
        },
        (err) => {
          reject(err);
        }
      );
    });
  }
}

module.exports = new PasswordResetSubmitBroker(db);