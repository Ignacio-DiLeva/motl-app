"use strict";
let config = require("./config");
let db = require("./DatabaseBroker");
let chat = require("./ChatBroker");
let crypto = require("./CryptoBroker");
let s3 = require("./S3Broker");
let calendar = require("./CalendarBroker");
let randomstring = require("randomstring");

class ProfileBroker {
  constructor(db, s3, chat, calendar) {
    this.db = db;
    this.s3Broker = s3;
    this.chatBroker = chat;
    this.calendarBroker = calendar;
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
            "group" : parseInt(res.group_number)
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
        this.db.query("UPDATE users SET group_number = " + group.toString() + " WHERE id = " + group);
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

  groupWizard(chat_user, chat_admin, chat_all, reusable){
    return new Promise((resolve, reject) => {
      this.db.query("INSERT INTO groups DEFAULT VALUES RETURNING id").then(
        async (gid_res) => {
          let gid = parseInt(gid_res.rows[0].id);
          await this.calendarBroker.uploadCalendar(config.default_calendar, gid);
          let user_chat = await this.chatBroker.createChat(chat_user, []);
          let admin_chat = await this.chatBroker.createChat(chat_admin, []);
          let all_chat = await this.chatBroker.createChat(chat_all, []);
          let code_users = null;
          let code_admins = null;
          while(true){
            code_users = randomstring.generate({
              length: 8,
              charset: 'alphanumeric'
            });
            let check_code = await this.db.query("SELECT * FROM init_config WHERE code = '" + code_users + "'");
            if(check_code.rowCount == 0) break;
          }
          while(true){
            code_admins = randomstring.generate({
              length: 8,
              charset: 'alphanumeric'
            });
            let check_code = await this.db.query("SELECT * FROM init_config WHERE code = '" + code_admins + "'");
            if(check_code.rowCount == 0) break;
          }
          await this.db.query("INSERT INTO init_config (code, chats, user_type, reusable, cant_uses, group_number) VALUES ('" + code_users  + "', ARRAY[" + user_chat.toString()  + ", " + all_chat.toString() + "], 'user', "    + reusable.toString() + ", 0, " + gid.toString() + ")");
          await this.db.query("INSERT INTO init_config (code, chats, user_type, reusable, cant_uses, group_number) VALUES ('" + code_admins + "', ARRAY[" + admin_chat.toString() + ", " + all_chat.toString() + "], 'teacher', " + reusable.toString() + ", 0, " + gid.toString() + ")");
          resolve({"group_number" : gid, "users" : code_users, "admins" : code_admins});
        },
        (err) => {reject(err);}
      );
    });
  }
}

module.exports = new ProfileBroker(db,s3, chat, calendar);