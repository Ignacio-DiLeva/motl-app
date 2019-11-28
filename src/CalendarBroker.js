let config = require("./config");
let s3Broker = require("./S3Broker");
let db = require("./DatabaseBroker");

class CalendarBroker{
  constructor(db, s3){
    this.db = db;
    this.s3Broker = s3;
  }

  uploadCalendar(file, group){
    return new Promise((resolve, reject) => {
      if(group == undefined || group == null) group = 0;
      s3Broker.putObject("calendar/" + group.toString(), file).then(
        () => {resolve("SUCCESS");},
        (err) => {reject(err);}
      );
    });
  }
}

module.exports = new CalendarBroker(db, s3Broker);