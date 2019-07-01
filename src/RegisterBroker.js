'use strict'
let db = require('./DatabaseBroker');
let crypto = require("./CryptoBroker");
let config = require('./config');

class RegisterBroker{
  constructor(db){
    this.db = db;
  }
  
  register(user, shownUser, password, email, phone){
    return new Promise((resolve, reject) => {
      if(!this.db.checkUser(user))
        reject("BAD_USER");
      if(!this.db.checkUser(shownUser))
        reject("BAD_SHOWN_USER");
      if(!this.db.checkPassword(password))
        reject("BAD_PASSWORD");
      if(!this.db.checkEmail(email))
        reject("BAD_EMAIL");
      if(!this.db.checkPhone(phone))
        reject("BAD_PHONE");
      this.checkUserExists(user).then(
        () => {
          hash = await crypto.hash(password);
          if(typeof(hash) !== 'string')
            reject("ERROR_INTERNAL");
          let registerQuery = "INSERT INTO users (username, shown_username, password, session_id, email, phone, permissions_id, password_reset_id) VALUES ('" + user + "','" + shownUser +"','" + hash + "'," + "0,'" + email + "','" + phone + "'," + "{}" + ",'" + config.permissions.USER + "," + '0' +")";
          db.query(registerQuery).then(
            () => {resolve("SUCCESS");},
            () => {reject("ERROR_INTERNAL");}
          );
        },
        () => {
          reject("USER_ALREADY_EXISTS");
        }
      )
    });
  }
  
  checkUserExists(user){
    return new Promise((resolve, reject) => {
      if(!this.db.checkUser(user))
        reject("BAD_USER");
      this.db.query("SELECT * FROM users WHERE user = '" + user + "'").then(
        (result) => {
          resolve(result.rowCount > 0);
        },
        (err) => {reject(err);}
      );
    })
  }
}

module.exports = new RegisterBroker(db);