'use strict'
let db = require('./DatabaseBroker');
let crypto = require("./CryptoBroker");
let cookieBroker = require("./CookieBroker");
let config = require('./config');

class LoginBroker{
  constructor(db){
    this.db = db;
  }
  
  login(user, password){
    return new Promise((resolve, reject) => {
      if(!this.db.checkUser(user))
        reject("BAD_USER");
      if(!this.db.checkPassword(password))
        reject("BAD_PASSWORD");
      this.db.returnUserData(user).then(
        (data) => {
          let passwordCheck = await crypto.passwordCheck(data.password, password);
          if(passwordCheck){
            cookieBroker.setCookie(user, null).then(
              (cookie) => {resolve(cookie);},
              (err) => {reject(err);}
            );
          }
          reject("ERROR_PASSWORD_INCORRECT");
        },
        () => {
          reject("ERROR_USER_NOT_FOUND");
        }
      )
    });
  }
}

module.exports = new LoginBroker(db);