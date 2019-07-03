'use strict'
let db = require('./DatabaseBroker');
let crypto = require("./CryptoBroker");
let config = require('./config');
let cookieBroker = require("./CookieBroker");

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
        (exists) => {
          if(exists)
            reject("USER_ALREADY_EXISTS");
          crypto.hash(password).then(
            (hash) => {
              if(typeof(hash) !== 'string')
                reject("ERROR_INTERNAL_HASH_NOT_STRING");
              let registerQuery = "INSERT INTO users (username, shown_username, password, session_ids, email, phone, chats, permissions_id, password_reset_id) VALUES ('" + user + "','" + shownUser +"','" + hash + "',array[]::bigint[],'" + email + "','" + phone + "',array[]::bigint[]," + config.permissions.USER + ",0)";
              this.db.query(registerQuery).then(
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
        },
        (err) => {reject(err);}
      );
    });
  }
  
  checkUserExists(user){
    return new Promise((resolve, reject) => {
      if(!this.db.checkUser(user))
        reject("BAD_USER");
      this.db.query("SELECT * FROM users WHERE username = '" + user + "'").then(
        (result) => {
          resolve(result.rowCount > 0);
        },
        (err) => {reject(err);}
      );
    });
  }
}

module.exports = new RegisterBroker(db);