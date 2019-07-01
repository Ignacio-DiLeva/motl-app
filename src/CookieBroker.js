'use strict'
let config = require('./config');
let db = require('./DatabaseBroker');

class CookieBroker{
    constructor(db){
        this.db = db;
    }
}

module.exports = new CookieBroker(db);