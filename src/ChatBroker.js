"use strict";
let db = require('./DatabaseBroker');
let time = require("./TimeBroker");

class ChatBroker{
  constructor(db){
    this.db = db;
  }

  chatDiscovery(user){
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM chats WERE " + user.toString() + " = ANY(users) ORDER BY timestamp_last_message DESC").then(
        (result) => {
          let l = [];
          result.rows.forEach((chat) => {
            l.push({
              "id" : chat.id,
              "name" : chat.name,
              "users" : chat.users,
              "message_count" : chat.messages.length
            });
          });
          resolve(l);
        },
        (err) => {reject(err);}
      );
    });
  }

  getMessages(chat_id){
    return new Promise((resolve, reject) => {
      this.db.query("SELECT messages FROM chats WERE id = " + chat_id.toString()).then(
        async (result) => {
          let messages = [];
          result.rows.forEach((message_id) => {
            const message_data = await db.query("SELECT * from messages WHERE id = " + message_id.toString())
            messages.push({
              "id" : message_data.id,
              "author" : message_data.author,
              "timestamp" : message_data.timestamp,
              "message_type" : message_data.message_type,
              "content" : message_data.content,
              "flags" : message_data.flags
            });
          });
          resolve(messages);
        },
        (err) => {reject(err);}
      );
    });
  }

  addUser(chat_id, user_id){
    return new Promise((resolve, reject) => {
      this.db.query("UPDATE chats SET users = array_append(users, " + user_id.toString() + "::bigint) WHERE id = " + chat_id.toString()).then(
        () => {resolve("SUCCESS");},
        (err) => {reject(err);} 
      );
    });
  }

  removeUser(chat_id, user_id){
    return new Promise((resolve, reject) => {
      this.db.query("UPDATE chats SET users = array_remove(users, " + user_id.toString() + "::bigint) WHERE id = " + chat_id.toString()).then(
        () => {resolve("SUCCESS");},
        (err) => {reject(err);} 
      );
    });
  }

  createChat(name, users){
    return new Promise((resolve, reject) => {
      let timestamp = time.getUnixTime();
      this.db.query("INSERT INTO chats (name, users, messages, timestamp_created, timestamp_last_message) VALUES ('" + name + "', " + "ARRAY[" + users.join(", ") + "], array[]::bigint[], " + timestamp.toString() + ", " + timestamp.toString() + ") RETURNING id").then(
        (res) => {resolve(res.rows[0].id);},
        (err) => {reject(err);} 
      );
    });
  }

  submitMessage(chat_id, author, content_type, content, flags){
    return new Promise((resolve, reject) => {
      let timestamp = time.getUnixTime();
    });
  }
}

module.exports = new ChatBroker(db);