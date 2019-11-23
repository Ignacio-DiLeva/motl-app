"use strict";
let db = require("./DatabaseBroker");
let crypto = require("./CryptoBroker");
let s3 = require("./S3Broker");

class ProfileBroker {
  constructor(db, s3) {
    this.db = db;
    this.s3Broker = s3;
  }

  nameSeach(username) {
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM users WHERE shown_username ILIKE '%" + username.split().join("%' OR shown_username ILIKE '%") + "%'").then(
        (data) => {
          let res = []
          for (let i = 0; i < data.rowCount; i++) {
            res.push({
              "id": parseInt(data.rows[i].id),
              "username": data.rows[i].username,
              "shown_username": data.rows[i].shown_username
            });
          }
          resolve(res);
        },
        (err) => { reject(err); }
      );
    });
  }

  nameSeachToIds(username) {
    return new Promise((resolve, reject) => {
      this.nameSeach(username).then(
        (data) => {
          let ids = [];
          data.forEach((user) => {
            ids.push(user.id);
          });
          return ids;
        },
        (err) => { reject(err); }
      );
    });
  }

  idToShownUsername(id){
    return new Promise((resolve, reject) => {
      this.db.idToShownUsername(id).then(
        (res) => {resolve(res);},
        (err) => {reject(err);}
      );
    });
  }

  shownUsernameToIds(id){
    return new Promise((resolve, reject) => {
      this.db.shownUsernameToIds(id).then(
        (res) => {resolve(res);},
        (err) => {reject(err);}
      );
    });
  }

  downloadProfile(id){
    return new Promise((resolve, reject) => {
      this.db.returnUserDataFromId(id).then(
        async (res) => {
          resolve({
            "id" : parseInt(res.id),
            "username" : res.username,
            "shown_username" : res.shown_username,
            "email" : res.email,
            "phone" : res.phone,
            "user_type" : res.user_type,
            "room" : parseInt(res.room),
            "roommates" : res.roommates,
            "health_info" : res.health_info,
            "group" : parseInt(res.group)
            }
          );
        },
        (err) => {reject(err);}
      );
    });
  }

  updateProfile(id, username, password, shown_username, email, phone, user_type, room, roommates, health_info, group, image){
    return new Promise((resolve, reject) => {
      if(username != undefined && this.db.checkUser(username)){
        this.db.query("UPDATE users SET username = '" + username + "' WHERE id = " + id);
      }
      if(shown_username != undefined && this.db.checkUser(shown_username)){
        this.db.query("UPDATE users SET shown_username = '" + shown_username + "' WHERE id = " + id);
      }
      if(email != undefined){
        this.db.query("UPDATE users SET email = '" + email + "' WHERE id = " + id);
      }
      if(phone != undefined){
        this.db.query("UPDATE users SET phone = '" + phone + "' WHERE id = " + id);
      }
      if(user_type != undefined){
        this.db.query("UPDATE users SET user_type = '" + user_type + "' WHERE id = " + id);
      }
      if(room != undefined){
        this.db.query("UPDATE users SET room = " + room.toString() + " WHERE id = " + id);
      }
      if(roommates != undefined){
        this.db.query("UPDATE users SET roommates = '" + roommates + "' WHERE id = " + id);
      }
      if(health_info != undefined){
        this.db.query("UPDATE users SET health_info = '" + health_info + "' WHERE id = " + id);
      }
      if(group != undefined){
        this.db.query("UPDATE users SET room = " + group.toString() + " WHERE id = " + group);
      }
      if(password != undefined){
        crypto.hash(password).then(
          (hash) => {this.db.query("UPDATE users SET password = '" + hash + "' WHERE id = " + group);} 
        );
      }
      if(image != null){
        this.s3Broker.putObject("profile_images/" + id.toString(), image).then(
          () => {},
          (err) => {return reject(err);}
        );
      }
      resolve("SUCCESS");
    });
  }
}

module.exports = new ProfileBroker(db,s3);