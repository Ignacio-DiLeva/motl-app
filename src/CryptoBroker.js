'use strict'
let config = require('./config');
let bcrypt = require("bcrypt");

class CryptoBroker{
  constructor(){
  }
  
  hash(data){
    return new Promise((resolve, reject) => {
      bcrypt.hash(data, config.hashRounds).then(
        (hashed) => {
          return resolve(hashed);
        },
        (err) => {
          reject(err);
        }
      )
    });
  }

  checkHashMatch(hash, test){
    return bcrypt.compare(test, hash);
  }

}

module.exports = new CryptoBroker();