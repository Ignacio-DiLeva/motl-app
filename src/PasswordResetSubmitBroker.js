'use strict'
let config = require('./config');
let db = require('./DatabaseBroker');
let login = require("./LoginBroker");
let email = require("./EMailBroker");

class PasswordResetSubmitBroker{
  constructor(db){
    this.db = db;
  }

  submitReset(user, code, new_password){
    return new Promise((resolve, reject) => {
      login.returnUserData(user).then(
        (data) => {
          db.query("SELECT * from password_reset WHERE id = " + data.password_reset_id).then(
            (result) => {
              
              reject("TODO");
            },
            (err) => {reject("ERROR_USER_NOT_FOUND");}
          )
        },
        (err) => {reject(err);}
      )
    })
  }

  updatePassword(user, password){
    return new Promise((resolve, reject) => {
      this.db.query("UPDATE users set (password) VALUES ('" + password + "')").then(
        () => {

          resolve("SUCCESS");
        },
        (err) => {reject(err);}
      )
    });
  }
}

module.exports = new PasswordResetSubmitBroker(db);