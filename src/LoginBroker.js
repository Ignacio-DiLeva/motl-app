'use strict'
let db = require('./DatabaseBroker');
let crypto = require("./CryptoBroker");
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
      this.returnUserData(user).then(
        (data) => {
          let passwordCheck = await crypto.passwordCheck(data.password, password);
          if(passwordCheck){
            resolve("SUCCESS");
          }
          reject("ERROR_PASSWORD_INCORRECT");
        },
        () => {
          reject("ERROR_USER_NOT_FOUND");
        }
      )
    });
  }
  
  returnUserData(user){
    return new Promise((resolve, reject) => {
      if(!this.db.checkUser(user))
        reject("BAD_USER");
      this.db.query("SELECT * FROM users WHERE user = '" + user + "'").then(
        (result) => {
          if(result.rowCount == 1)
            resolve(result.rows[0]);
          reject("ERROR_USER_NOT_FOUND");
        },
        (err) => {reject(err);}
      );
    })
  }
}

module.exports = new LoginBroker(db);