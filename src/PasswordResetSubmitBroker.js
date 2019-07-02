'use strict'
let config = require('./config');
let login = require('./LoginBroker');
let db = require('./DatabaseBroker');
let time = require('./TimeBroker');
let crypto = require("./TimeBroker");

class PasswordResetSubmitBroker{
  constructor(db){
    this.db = db;
  }

  submitReset(user, code, new_password){
    return new Promise((resolve, reject) => {
      if(!this.db.checkPassword(password))
        reject("BAD_PASSWORD");
      this.db.returnUserData(user).then(
        (data) => {
          db.query("SELECT * FROM password_reset WHERE id = " + data.password_reset_id).then(
            (result) => {
              if(result[0].code !== code){
                reject("ERROR_INCORRECT_CODE");
              }
              if(result[0].timestamp < time.getUnixTime()){
                reject("ERROR_OUT_OF_TIME");
              }

              db.query("DELETE * FROM password_reset WHERE id = " + data.password_reset_id).then(
                () => {
                  this.updatePassword(user, new_password).then(
                    () => {
                      login.login(user, new_password).then(
                        (cookie) => {resolve(cookie);},
                        (err) => {reject(err);}
                      );
                    },
                    (err) => {reject(err);}
                  );
                },
                (err) => {reject(err);}
              );
            },
            (err) => {reject("ERROR_USER_NOT_FOUND");}
          )
        },
        (err) => {reject(err);}
      )
    })
  }

  updatePassword(user, password){
    return this.db.query("UPDATE users set (password, reset_password_id) VALUES ('" + crypto.hash(password) + "', 0) WHERE username = '" + user + "'");
  }
}

module.exports = new PasswordResetSubmitBroker(db);