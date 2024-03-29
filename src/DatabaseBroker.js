"use strict";
let config = require('./config');
let mailcheck = require("email-existence")
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

  returnUserDataFromId(user){
    return new Promise((resolve, reject) => {
      this.query("SELECT * FROM users WHERE id = " + user).then(
        (result) => {
          if(result.rowCount == 1)
            resolve(result.rows[0]);
          else reject("ERROR_USER_NOT_FOUND");
        },
        (err) => {return reject(err);}
      );
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

  idToShownUsername(id){
    return new Promise((resolve, reject) => {
      this.returnUserDataFromId(id).then(
        (data) => {resolve(data.shown_username);},
        (err) => {reject(err);}
      );
    });
  }

  shownUsernameToIds(username){
    return new Promise((resolve, reject) => {
        this.query("SELECT * FROM users WHERE shown_username = '" + username + "'").then(
          (data) => {
            let ids = [];
            data.rows.forEach((row) => {
              ids.push(parseInt(row.id));
            });
            resolve(ids);
          },
          (err) => {reject(err);}
        );
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
    if (typeof(str) != 'string' || !config.emailRegexFull.test(str)) return false;
    /*mailcheck.check(str, (err, res) => {
      if(err) return false;
      return res;
    });*/
    return true;
  }

  checkPhone(str){
    if (typeof(str) != 'string') return false;
    return config.phoneRegexFull.test(str);
  }
}

module.exports = new DatabaseBroker(config.connData);

