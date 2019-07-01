'use strict'
let config = require('./config');

class DatabaseBroker{
  constructor(connData){
    this.conn = new Client(connData);
    this.conn.connect();
  }
  
  query(queryStr){
    return new Promise((resolve, reject) => {
      this.conn.query(queryStr, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }

  checkStr(str){
    if (typeof(str) != 'string') return false;
    return config.strRegexFull.test(str);
  }

  checkUser(str){
    if(!this.checkStr(str)) return false;
    const l = String.length(str);
    return l > 0 && l <= 72;
  }

  checkPassword(str){
    if(!this.checkStr(str)) return false;
    const l = String.length(str);
    return l >= 8 && l <= 72;
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

