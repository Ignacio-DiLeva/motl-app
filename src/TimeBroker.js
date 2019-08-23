"use strict";
let config = require('./config');

class TimeBroker{
  constructor(){

  }

  getUnixTime(){
    return Math.round((new Date()).getTime() / 1000);
  }
}

module.exports = new TimeBroker();