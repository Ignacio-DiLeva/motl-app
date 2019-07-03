'use strict'
let db = require('./DatabaseBroker');
let crypto = require("./CryptoBroker");
let cookieBroker = require("./CookieBroker");
let config = require('./config');

class LoginBroker{
  constructor(db){
    this.db = db;
  }
  
  login(user, password, cookie){
    return new Promise((resolve, reject) => {
      if(!this.db.checkUser(user))
        reject("BAD_USER");
      if(!this.db.checkPassword(password))
        reject("BAD_PASSWORD");
      this.db.returnUserData(user).then(
        (data) => {
          crypto.checkHashMatch(data.password, password).then(
            (passwordCheck) => {
              if(passwordCheck){
                cookieBroker.setCookie(user, cookie).then(
                  (cookie) => {resolve(cookie);},
                  (err) => {reject(err);}
                );
              }
              else{
                reject("ERROR_PASSWORD_INCORRECT");
              }
            },
            (err) => {reject(err);}
          );
        },
        () => {
          reject("ERROR_USER_NOT_FOUND");
        }
      );
    });
  }
}

module.exports = new LoginBroker(db);