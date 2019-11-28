"use strict";
let db = require("./DatabaseBroker");
let time = require("./TimeBroker");
let s3Broker = require('./S3Broker');

class PostsBroker {
  constructor(db, s3) {
    this.db = db;
    this.s3Broker = s3;
  }

  submitPost(section, content_type, user, content, description) {
    return new Promise((resolve, reject) => {
      //content = '' in S3 update
      if(section.charAt(0) == "@"){
        this.db.returnUserDataFromId(user).then(
          (data) => {
            let username = data.username;
            let username2 = section.substring(1);
            let s1 = username + "@" + username2;
            let s2 = username2 + "@" + username;
            this.db.query("INSERT INTO posts (section, content_type, user_id, content, comments, description) VALUES ('" + s1 + "','" + content_type + "'," + user + ",'" + '' + "',array[]::bigint[],'" + description + "') RETURNING id").then(
              (id) => {
                this.s3Broker.putObject("posts/" + id.rows[0].id.toString(), content).then(
                  () => {
                    this.db.query("INSERT INTO posts (section, content_type, user_id, content, comments, description) VALUES ('" + s2 + "','" + content_type + "'," + user + ",'" + '' + "',array[]::bigint[],'" + description + "') RETURNING id").then(
                      (id2) => {
                        this.s3Broker.putObject("posts/" + id2.rows[0].id.toString(), content).then(
                          () => {
                            return resolve("SUCCESS");
                          }
                        );
                      },
                      (err) => {
                        return reject("ERROR_INTERNAL");
                      }
                    );
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
        this.db.query("INSERT INTO posts (section, content_type, user_id, content, comments, description) VALUES ('" + section + "','" + content_type + "'," + user + ",'" + '' + "',array[]::bigint[],'" + description + "') RETURNING id").then(
          (id) => {
            this.s3Broker.putObject("posts/" + id.rows[0].id.toString(), content).then(
              () => {
                return resolve("SUCCESS");
              }
            );
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
      this.db.query("INSERT INTO comments (user_id, comment) VALUES (" + user + ",'" + comment + "') RETURNING id").then(
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
      this.db.query("SELECT * FROM posts WHERE id = " + post_id).then(
        (result) => {
          let row = result.rows[0];
          this.db.returnUserDataFromId(row.user_id).then(
            (user_res) => {
              let res = {
                "id": parseInt(row.id),
                "section": row.section,
                "content_type": row.content_type,
                "author": user_res.shown_username,
                "user" : parseInt(user_res.id),
                "content": row.content,
                "description": row.description,
                "comments": []
              };
              this.db.query("SELECT * FROM comments WHERE id = ANY ('{" + row.comments.join(",") + "}'::bigint[])").then(
                async (comments) => {
                  for(let i = 0; i < comments.rowCount; i++){
                    let c_row = comments.rows[i];
                    let c_user_res = await db.returnUserDataFromId(c_row.user_id);
                    res.comments.push(
                      {
                        "id": parseInt(c_row.id),
                        "author": c_user_res.shown_username,
                        "user": parseInt(c_row.user_id),
                        "comment": c_row.comment
                      }
                    );
                  }
                  return resolve(res);
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

  getPostBySectionAndType(section, content_type) {
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM posts WHERE section='" + section + "' AND content_type ='" + content_type + "'").then(
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

 getPostJson (section, number, no_content) {
    return new Promise((resolve, reject) => {
      let q = "SELECT * FROM posts WHERE section='" + section + "' ORDER BY id DESC LIMIT " + number;
      this.db.query(q).then(
        async (result) => {
          let l = [];
          for(let i = 0; i < result.rowCount; i++){
            let row = result.rows[i];
            try {
              const user_res = await this.db.returnUserDataFromId(row.user_id);
              if(no_content)
                l.push({
                "id": parseInt(row.id),
                "section": section,
                "content_type": row.content_type,
                "author": user_res.shown_username,
                "user" : parseInt(user_res.id)
              });
              else l.push({
                "id": parseInt(row.id),
                "section": section,
                "content_type": row.content_type,
                "author": user_res.shown_username,
                "user" : parseInt(user_res.id),
                "content": row.content,
                "description": row.description
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

  postDiscovery(section, number, user_id, no_content) {
    return new Promise((resolve, reject) => {

      if(no_content === undefined) no_content = false;
      else if(no_content == "true") no_content = true;
      else if(no_content == "false") no_content = false;
      else if(no_content == null) no_content = false;
      else if(no_content == "") no_content = true;
      else no_content = !!no_content;

      if(user_id != undefined && user_id != null && section.charAt(0) == "@"){
        this.db.returnUserDataFromId(user_id).then(
          (data) => {
            section = section.substring(1) + "@" + data.username;
            this.getPostJson(section, number, no_content).then(
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
        this.getPostJson(section, number, no_content).then(
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

  updatePost(post_id, content_type, file, desc){
    return new Promise((resolve, reject) => {
      this.db.query("UPDATE posts SET description = '" + desc + "', content_type = '" + content_type + "' WHERE id = " + post_id,toString()).then(
        () => {
          this.s3Broker.putObject("posts/" + post_id.toString(), file).then(
            () => {resolve("SUCCESS");},
            (err) => {reject(err);}
          );
        },
        (err) => {reject(err);}
      );
    });
  }

  deletePost(post_id) {
    return new Promise((resolve, reject) => {
      this.db.query("DELETE FROM posts WHERE id = " + post_id).then(
        () => {resolve("SUCCESS");},
        (err) => {reject(err);}
      );
    });
  }
}

module.exports = new PostsBroker(db, s3Broker);