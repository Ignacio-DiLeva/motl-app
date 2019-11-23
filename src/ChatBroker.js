"use strict";
let db = require('./DatabaseBroker');
let time = require("./TimeBroker");
let s3Broker = require('./S3Broker');

class ChatBroker{
  constructor(db,s3){
    this.db = db;
    this.s3Broker = s3;
  }

  chatDiscovery(user){
    return new Promise((resolve, reject) => {
      this.db.query("SELECT * FROM chats WHERE " + user.toString() + " = ANY(users) ORDER BY timestamp_last_message DESC").then(
        (result) => {
          let l = [];
          result.rows.forEach((chat) => {
            let user_list = Array.from(chat.users);
            let user_list_fized = [];
            user_list.forEach((user) => {
              user_list_fized.push(parseInt(user));
            });
            l.push({
              "id" : parseInt(chat.id),
              "name" : chat.name,
              "users" : user_list_fized,
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
      this.db.query("SELECT messages FROM chats WHERE id = " + chat_id.toString()).then(
        async (result) => {
          let result_messages = Array.from(result.rows[0].messages);
          let result_messages_fixed = [];
          result_messages.forEach((user) => {
            result_messages_fixed.push(parseInt(user));
          });
          let messages = [];
          for(let i = 0; i < result_messages_fixed.length; i++){
            let message = await db.query("SELECT * from messages WHERE id = " + result_messages_fixed[i].toString());
            let message_data = message.rows[0];
            messages.push({
              "id" : parseInt(message_data.id),
              "author" : parseInt(message_data.author),
              "timestamp" : parseInt(message_data.timestamp),
              "content_type" : message_data.content_type,
              "content" : message_data.content,
              "flags" : message_data.flags
            });
          }
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
      if(typeof users === "string"){
        users = JSON.parse(users);
      }
      let timestamp = time.getUnixTime();
      this.db.query("INSERT INTO chats (name, users, messages, timestamp_created, timestamp_last_message) VALUES ('" + name + "', " + "ARRAY[" + users.join(", ") + "], array[]::bigint[], " + timestamp.toString() + ", " + timestamp.toString() + ") RETURNING id").then(
        (res) => {resolve(parseInt(res.rows[0].id));},
        (err) => {reject(err);} 
      );
    });
  }

  changeName(chat_id, name){
    return new Promise((resolve, reject) => {
      this.db.query("UPDATE chats SET name = '" + name + "' WHERE id = " + chat_id).then(
        () => {resolve("SUCCESS");},
        (err) => {reject(err);} 
      );
    });
  }

  submitMessage(chat_id, author, content_type, content, flags){
    return new Promise((resolve, reject) => {
      let timestamp = time.getUnixTime();
      let q = "INSERT INTO messages (author, timestamp, content_type, content, flags) VALUES ('" + author + "', " + timestamp.toString() + ", '" + content_type + "', '" + "" + "', '" + flags + "') RETURNING id";
      if(content_type === "text")
        q = "INSERT INTO messages (author, timestamp, content_type, content, flags) VALUES ('" + author + "', " + timestamp.toString() + ", 'text', '" + content + "', '" + flags + "') RETURNING id";
      this.db.query(q).then(
        (res) => {
          let m_id = res.rows[0].id;
          this.db.query("UPDATE chats SET messages = array_append(messages, " + m_id + "::bigint), timestamp_last_message = " + timestamp + " WHERE id = " + chat_id.toString()).then(
            () => {
              if(content_type == "text") {resolve("SUCCESS");}
              else{
                this.s3Broker.putObject("messages/" + m_id.toString(), content).then(
                  () => {resolve("SUCCESS");},
                  (err) => {reject(err);}
                );
              }
            },
            (err) => {reject(err);}
          );
        },
        (err) => {reject(err);} 
      );
    });
  }
}

module.exports = new ChatBroker(db,s3Broker);