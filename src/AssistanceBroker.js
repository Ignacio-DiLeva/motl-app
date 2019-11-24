"use strict";
let db = require("./DatabaseBroker");
let time = require("./TimeBroker")

class AssistanceBroker{
  constructor(db){
    this.db = db;
  }

  listLogs(user){
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM assistance_logs WHERE user_id = " + user + "ORDER BY time DESC").then(
        (res) => {
          let result = [];
          res.rows.forEach((row) => {
            result.push({id: parseInt(row.id), user: parseInt(row.user), time: parseInt(row.time), location: row.location,activity: row.activity})
          });
          resolve(result);
        },
        (err) => {reject(err);}
      );
    });
  }

  getLog(log_id){
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM assistance_logs WHERE id = " + log_id).then(
        (res) => {
          let row = res.rows[0];
          resolve({id: parseInt(row.id), user: parseInt(row.user), time: parseInt(row.time), location: row.location,activity: row.activity, status: row.status});
        },
        (err) => {reject(err);}
      );
    });
  }

  setLog(log_id, values){
    return new Promise((resolve, reject) => {
      this.db.query("UPDATE assistance_logs SET user_id = " + values.user + ",time = " + time.getUnixTime().toString() + ",location = '" + values.location + "',activity = '" + values.activity + "', status = '" + values.status + "' WHERE id =" + log_id).then(
        () => {resolve("SUCCESS");},
        (err) => {reject(err);}
      );
    });
  }

  createLog(values){
    return new Promise((resolve, reject) => {
      this.db.query("INSERT INTO assistance_logs (user_id, time, location, activity, status) VALUES (" + values.user + "," + time.getUnixTime().toString() + ",'" + values.location + "','" + values.activity + "','" + values.status + "') RETURNING id").then(
        (res) => {resolve(parseInt(res.rows[0].id));},
        (err) => {reject(err);}
      );
    });
  }
}

module.exports = new AssistanceBroker(db);
