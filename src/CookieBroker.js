'use strict'
let config = require('./config');
let db = require('./DatabaseBroker');
let time = require('./TimeBroker');
let randomstring = require('randomstring');


class CookieBroker{
  constructor(db){
    this.db = db;
  }

  verifyCookie(user, cookie){
    return new Promise((resolve, reject) => {
      let current_time = time.getUnixTime();
      let ok = false;
      this.getCookies(user).then(
        (cookies) => {
          cookies.forEach(row => {
            if(row.cookie === cookie){
              if(row.timestamp < current_time){
                this.db.query("UPDATE users SET session_ids = array_remove(session_ids," + row.id + ");").then(
                  () => {},
                  (err) => {reject(err);}
                );
                this.db.query("DELETE * FROM sessions WHERE id = " + row.id).then(
                  () => {},
                  (err) => {reject(err);}
                );
              }
              else{
                ok = true;
              }
            }
          });
          resolve(ok);
        },
        (err) => {reject(err);}
      );
    });
  }

  setCookie(user, cookie){
    return new Promise((resolve, reject) => {
      this.getCookies(user).then(
        (cookies) => {
          if(!!cookie){
            let found = false;
            cookies.forEach(row => {
              if(row.text === cookie){
                found = true;
                this.db.query("UPDATE sessions SET (timestamp) VALUES (" + (time.getUnixTime() + config.secsInDay).toString() + ") WHERE ID = " + row.id).then(
                  () => {},
                  (err) => {reject(err);}
                );
              } else{
                this.db.query("UPDATE users SET session_ids = array_remove(session_ids," + row.id + ");").then(
                  () => {},
                  (err) => {reject(err);}
                );
                this.db.query("DELETE * FROM sessions WHERE id = " + row.id).then(
                  () => {},
                  (err) => {reject(err);}
                );
              }
            });
            if(found) resolve(cookie);
          }
          let cookie_part = ":" + randomstring.generate({
            length: 16,
            charset: 'alphanumeric'
          });
          this.db.query("INSERT INTO sessions (timestamp, cookie) VALUES (" + (time.getUnixTime() + config.secsInDay).toString() + ",'" + user + cookie_part + "') RETURNING id").then(
            (row) => {
              this.db.query("UPDATE users SET session_ids = array_append(session_ids," + row.id + ");").then(
                () => {resolve(cookie);},
                (err) => {reject(err);}
              );
            },
            (err) => {reject(err);}
          );
        },
        (err) => {reject(err);}
      );
    });
  }

  getCookies(user){
    return new Promise((resolve, reject) => {
      this.db.returnUserData(user).then(
        (data) => {
          let db_query = "SELECT * FROM sessions WHERE id IN {";
          data.session_ids.forEach(element => {
            db_query += ", " + element.toString();
          });
          db_query += "}"
          this.db.query(db_query).then(
            (cookies) => {
              resolve(cookies.rows);
            },
            (err) => {reject(err);}
          )
        },
        () => {reject("ERROR_USER_NOT_FOUND");}
      )
    });
  }

}

module.exports = new CookieBroker(db);