"use strict";
let db = require("db");

class AssistanceBroker{
  constructor(db){
    this.db = db;
  }

  listLogs(user){
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM assistance_logs WHERE user =" + user).then(
        (res) => {
          let result = [];
          res.rows.forEach((row) => {
            result.push({id = row.id, user = row.user, time = row.time, location = row.location,activity = row.activity})
          });
          resolve(result);
        },
        (err) => {reject(err);}
      );
    });
  }

  getLog(log_id){
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM assistance_logs WHERE id =" + log_id).then(
        (res) => {
          let row = res.rows[0];
          resolve({id = row.id, user = row.user, time = row.time, location = row.location,activity = row.activity, status = row.status});
        },
        (err) => {reject(err);}
      );
    });
  }

  setLog(log_id, values){
    return new Promise((resolve, reject) => {
      this.db.query("UPDATE assistance_logs SET user =" + values.user + ",time =" + values.time + ",location = '" + values.location + "',activity = '" + values.activity + "', status = '" + values.status.replace("'","\\'").replace('"', '\\"')+ "' WHERE id =" + log_id).then(
        () => {resolve("SUCCESS")},
        (err) => {reject(err);}
      );
    });
  }

  createLog(values){
    return new Promise((resolve, reject) => {
      this.db.query("INSERT INTO assistance_logs (user, time, location, activity, status) VALUES (" + values.user + "," + values.time + ",'" + values.location + "','" + values.activity + "','" + values.status.replace("'","\\'").replace('"', '\\"')+ "') RETURNING id").then(
        (res) => {resolve(res.rows[0].id)},
        (err) => {reject(err);}
      );
    });
  }
}

module.exports = new AssistanceBroker(db);
