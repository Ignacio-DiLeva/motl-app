"use strict";
let db = require("./DatabaseBroker");
let time = require("./TimeBroker")

class PostsBroker {
  constructor(db) {
    this.db = db;
  }

  submitPost(section, name, user, content) {
    return new Promise((resolve, reject) => {
      this.getPostBySectionAndName(section, name).then(
        (post) => {
          if (!!post && (name != null && name != "null")) {
            reject("POST_ALREADY_EXISTS");
            return;
          }
          this.db.query("INSERT INTO posts (section, name, user_id, content, comments) VALUES ('" + section + "','" + name + "'," + user + ",'" + content.replace(/[\\$'"]/g, "\\$&") + "',array[]::bigint[])").then(
            () => {
              resolve("SUCCESS");
            },
            (err) => {
              console.log(err);
              reject("ERROR_INTERNAL");
            }
          );
        }
      );
    });
  }

  submitComment(post_id, user, comment) {
    return new Promise((resolve, reject) => {
      this.db.query("INSERT INTO comments (user, comment) VALUES (" + user + ",'" + comment + "') RETURNING id").then(
        (result) => {
          let comment_id = result.rows[0].id;
          this.db.query("UPDATE posts SET comments = array_append(comments," + comment_id + "::bigint) WHERE id = " + post_id).then(
            () => { resolve("SUCCESS"); },
            (err) => { reject(err); }
          );
        },
        () => {
          reject("ERROR_INTERNAL");
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
                      (err) => { reject(err); }
                    );
                    resolve(res);
                  });
                },
                (err) => { reject(err); }
              );
            }
          );
        },
        (err) => { reject(err); }
      );
    });
  }

  getPostBySectionAndName(section, name) {
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM posts WHERE section='" + section + "' AND name='" + name + "'").then(
        (result) => {
          if (result.rowCount == 0) {
            resolve(null);
          }
          else {
            resolve(result.rows[0]);
          }
        },
        (err) => { reject(err); }
      );
    });
  }

  getPostJson(section, number) {
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM posts WHERE section='" + section + "' ORDER BY id DESC LIMIT " + number).then(
        (result) => {
          let l = [];
          for(let i = 0; i < result.rowCount; i++){
            let row = result.rows[i];
            db.query("SELECT * FROM users WHERE id = " + row.user_id).then(
              (user_res) => {
                l.push({
                  "id": row.id,
                  "section": section,
                  "name": row.name,
                  "user": user_res.rows[0].shown_username,
                  "content": row.content
                });
              },
              (err) => {reject(err);}
            ).then(
              () => { }
            );
          }
          console.log(l);
          resolve(l);
        },
      ).then(
        (res) => {return resolve(res);},
        (err) => {return reject(err);}
      );
    });
  }

  postDiscovery(section, number) {
    return new Promise((resolve, reject) => {
      this.getPostJson(section, number).then(
        (j) => {
          return resolve({
            "section": section,
            "time": time.getUnixTime(),
            "posts": j
          });
        }
      );
    });
  }
}

module.exports = new PostsBroker(db);