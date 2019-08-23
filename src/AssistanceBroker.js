"use strict";
let db = require("db");

class AssistanceBroker{
  constructor(db){
    this.db = db;
  }

  createNewLog(group_id){
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM groups WHERE id=" + group_id).then(
        (result) => {
          let sqlQuery = "INSERT INTO assistance_logs (time, location, activity, status) VALUES (0,'','','["
          result.rows[0].users.forEach((user) => {
            db.returnUserData(user).then(
              (data) => {
                sqlQuery += "{id:" + user + ", shown:\\'" + data.shown_username + "\\',status:0},"
              }
            );
          });
          sqlQuery = sqlQuery.substring(0, sqlQuery.length - 1) + "]') RETURNING id";
          this.db.query(sqlQuery).then(
            (log_id) => {
              this.db.query("UPDATE groups SET assistance_logs = array_append(assistance_logs," + log_id + "::bigint) WHERE id = " + group_id).then(
                () => {resolve("SUCCESS");},
                (err) => {reject(err);}
              );
            }
          );
        }
      );
    });
  }

  getLastLog(group_id){
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM groups WHERE id=" + group_id).then(
        (result) => {
          let log_num = result.rows[0].assistance_logs[lt.rows[0].assistance_logs.length - 1];
          this.db.query("SELECT * FROM assistance_logs WHERE id=" + log_num).then(
            (log) => {
              resolve({
                "id" : log.rows[0].id,
                "time" : log.rows[0].time,
                "location" : log.rows[0].location,
                "activity" : log.rows[0].activity,
                "status" : log.rows[0].status
              });
            },
            (err) => {reject(err);}
          );
        },
        (err) => {reject(err);}
      );
    });
  }

  setLastLog(log_id, values){
    return new Promise((resolve, reject) => {
      this.db.query("UPDATE assistance_logs SET time =" + values.time + ",location = '" + values.location + "',activity = '" + values.activity + "', status = '" + values.status.replace("'","\\'")+ "' WHERE id =" + log_id).then(
        () => {resolve("SUCCESS")},
        (err) => {reject(err);}
      );
    });
  }
}

module.exports = new AssistanceBroker(db);
