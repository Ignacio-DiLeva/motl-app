"use strict";
let db = require("./DatabaseBroker");
let time = require("./TimeBroker")

class PostsBroker {
  constructor(db) {
    this.db = db;
  }

  submitPost(section, name, user, content) {
    return new Promise((resolve, reject) => {
      if(section.charAt(0) == "@"){
        this.db.returnUserDataFromId(user).then(
          (data) => {
            let username = data.username;
            let username2 = section.substring(1);
            let s1 = username + "@" + username2;
            let s2 = username2 + "@" + username;
            this.db.query("INSERT INTO posts (section, name, user_id, content, comments) VALUES ('" + s1 + "','" + name + "'," + user + ",'" + content.replace(/[\\$'"]/g, "\\$&") + "',array[]::bigint[])").then(
              () => {
                this.db.query("INSERT INTO posts (section, name, user_id, content, comments) VALUES ('" + s2 + "','" + name + "'," + user + ",'" + content.replace(/[\\$'"]/g, "\\$&") + "',array[]::bigint[])").then(
                  () => {
                    return resolve("SUCCESS");
                  },
                  (err) => {
                    return reject("ERROR_INTERNAL");
                  }
                );
              },
              (err) => {
                return reject("ERROR_INTERNAL");
              }
            );
          },
          (err) => {return reject("ERROR_INTERNAL");}
        );
      }
      else{
        this.db.query("INSERT INTO posts (section, name, user_id, content, comments) VALUES ('" + section + "','" + name + "'," + user + ",'" + content.replace(/[\\$'"]/g, "\\$&") + "',array[]::bigint[])").then(
          () => {
            return resolve("SUCCESS");
          },
          (err) => {
            return reject("ERROR_INTERNAL");
          }
        );
      }
    });
  }

  submitComment(post_id, user, comment) {
    return new Promise((resolve, reject) => {
      this.db.query("INSERT INTO comments (user, comment) VALUES (" + user + ",'" + comment + "') RETURNING id").then(
        (result) => {
          let comment_id = result.rows[0].id;
          this.db.query("UPDATE posts SET comments = array_append(comments," + comment_id + "::bigint) WHERE id = " + post_id).then(
            () => { return resolve("SUCCESS"); },
            (err) => { return reject(err); }
          );
        },
        () => {
          return reject("ERROR_INTERNAL");
        }
      );
    });
  }

  getPostById(post_id) {
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM posts WHERE id=" + post_id).then(
        (result) => {
          let row = result.rows[0];
          db.query("SELECT * FROM users WHERE id = " + row.user_id).then(
            (user_res) => {
              let res = {
                "id": row.id,
                "section": row.section,
                "name": row.row.name,
                "user": user_res.shown_username,
                "content": row.content,
                "comments": []
              };
              this.db.query("SELECT * FROM comments WHERE id = ANY ('{" + row.comments.join(",") + "}'::bigint[])").then(
                (comments) => {
                  comments.rows.forEach((c_row) => {
                    db.returnUserData(c_row.user).then(
                      (c_user_res) => {
                        res.comments.push(
                          {
                            "id": c_row.id,
                            "user": c_user_res.shown_username,
                            "comment": c_row.comment
                          }
                        );
                      },
                      (err) => { return reject(err); }
                    );
                    return resolve(res);
                  });
                },
                (err) => { return reject(err); }
              );
            }
          );
        },
        (err) => { return reject(err); }
      );
    });
  }

  getPostBySectionAndName(section, name) {
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM posts WHERE section='" + section + "' AND name='" + name + "'").then(
        (result) => {
          if (result.rowCount == 0) {
            return resolve(null);
          }
          else {
            return resolve(result.rows[0]);
          }
        },
        (err) => { return reject(err); }
      );
    });
  }

 getPostJson (section, number) {
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM posts WHERE section='" + section + "' ORDER BY id DESC LIMIT " + number).then(
        async (result) => {
          let l = [];
          for(let i = 0; i < result.rowCount; i++){
            let row = result.rows[i];
            try {
              const user_res = await db.query("SELECT * FROM users WHERE id = " + row.user_id);
              l.push({
                "id": row.id,
                "section": section,
                "name": row.name,
                "user": user_res.rows[0].shown_username,
                "content": row.content
              });
            } catch (err) {
              return reject(err);
            }
          }
          resolve(l);
        },
      ).then(
        (res) => {return resolve(res);},
        (err) => {return reject(err);}
      );
    });
  }

  postDiscovery(section, number, user_id) {
    return new Promise((resolve, reject) => {
      if(user_id != undefined && user_id != null && section.charAt(0) == "@"){
        this.db.returnUserDataFromId(user_id).then(
          (data) => {
            section = section.substring(1) + "@" + data.username;
            this.getPostJson(section, number).then(
              (j) => {
                return resolve({
                  "section": section,
                  "time": time.getUnixTime(),
                  "posts": j
                });
              }
            );
          }
        );
      }
      else{
        this.getPostJson(section, number).then(
          (j) => {
            return resolve({
              "section": section,
              "time": time.getUnixTime(),
              "posts": j
            });
          }
        );
      }
    });
  }
}

module.exports = new PostsBroker(db);