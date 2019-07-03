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
      this.db.returnUserData(user).then(
        (data) => {
          this.getCookies(data).then(
            (cookies) => {
              cookies.forEach(row => {
                if(row.cookie === cookie){
                  if(row.timestamp < current_time){
                    this.db.query("UPDATE users SET session_ids = array_remove(session_ids," + row.id + ") WHERE id = " + data.id).then(
                      () => {},
                      (err) => {reject(err);}
                    );
                    this.db.query("DELETE FROM sessions WHERE id = " + row.id).then(
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
        },
        (err) => {reject(err);}
      );
    });
  }

  setCookie(user, cookie){
    return new Promise((resolve, reject) => {
      this.db.returnUserData(user).then(
        (data) => {
          this.getCookies(data).then(
            (cookies) => {
              if(!!cookie){
                let found = false;
                cookies.forEach(row => {
                  if(row.text === cookie){
                    found = true;
                    this.db.query("UPDATE sessions SET timestamp = " + (time.getUnixTime() + config.secsInDay).toString() + " WHERE id = " + row.id).then(
                      () => {},
                      (err) => {reject(err);}
                    );
                  } else{
                    this.db.query("UPDATE users SET session_ids = array_remove(session_ids," + row.id + "::bigint) WHERE id = " + data.id).then(
                      () => {},
                      (err) => {reject(err);}
                    );
                    this.db.query("DELETE FROM sessions WHERE id = " + row.id).then(
                      () => {},
                      (err) => {reject(err);}
                    );
                  }
                });
                if(found) resolve(cookie);
              }
              let insert_cookie = user + ":" + randomstring.generate({
                length: 16,
                charset: 'alphanumeric'
              });
              this.db.query("INSERT INTO sessions (timestamp, cookie) VALUES (" + (time.getUnixTime() + config.secsInDay).toString() + ",'" + insert_cookie + "') RETURNING id").then(
                (insertResult) => {
                  this.db.query("UPDATE users SET session_ids = array_append(session_ids," + insertResult.rows[0].id + "::bigint);").then(
                    () => {resolve(insert_cookie);},
                    (err) => {reject(err);}
                  );
                },
                (err) => {reject(err);}
              );
            },
            (err) => {reject(err);}
          );
        }
      );
    });
  }

  getCookies(data){
    return new Promise((resolve, reject) => {
      let db_query = "SELECT * FROM sessions WHERE id = ANY ('{" + data.session_ids.join(",") + "}'::bigint[])";
      this.db.query(db_query).then(
        (cookies) => {
          resolve(cookies.rows);
        },
        (err) => {reject(err);}
      );
    });
  }
}

module.exports = new CookieBroker(db);