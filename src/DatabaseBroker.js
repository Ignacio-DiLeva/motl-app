"use strict";
let config = require('./config');
const { Client } = require('pg');

class DatabaseBroker{
  constructor(connData){
    this.conn = new Client(connData);
    this.conn.connect();
  }
  
  query(queryStr){
    return new Promise((resolve, reject) => {
      this.conn.query(queryStr, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  returnUserData(user){
    return new Promise((resolve, reject) => {
      if(!this.checkUser(user))
        reject("BAD_USER");
      else {
        this.query("SELECT * FROM users WHERE username = '" + user + "'").then(
          (result) => {
            if(result.rowCount == 1)
              resolve(result.rows[0]);
            else reject("ERROR_USER_NOT_FOUND");
          },
          (err) => {reject(err);}
        );
      }
    });
  }

  checkStr(str){
    if (typeof(str) != 'string') return false;
    return config.strRegexFull.test(str);
  }

  checkUser(str){
    if(!this.checkStr(str)) return false;
    return str.length > 0 && str.length <= 72;
  }

  checkPassword(str){
    if(!this.checkStr(str)) return false;
    return str.length >= 8 && str.length <= 72;
  }

  checkEmail(str){
    if (typeof(str) != 'string') return false;
    return config.emailRegexFull.test(str);
  }

  checkPhone(str){
    if (typeof(str) != 'string') return false;
    return config.phoneRegexFull.test(str);
  }
}

module.exports = new DatabaseBroker(config.connData);

