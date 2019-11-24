"use strict";
let db = require('./DatabaseBroker');
let crypto = require("./CryptoBroker");
let config = require('./config');
let s3Broker = require("./S3Broker");
let chatBroker = require("./ChatBroker");

class RegisterBroker{
  constructor(db,s3){
    this.db = db;
    this.s3Broker = s3;
  }
  
  register(user, shownUser, password, email, phone, code){
    return new Promise((resolve, reject) => {
      if(!this.db.checkUser(user))
        reject("BAD_USER");
      else if(!this.db.checkUser(shownUser))
        reject("BAD_SHOWN_USER");
      else if(!this.db.checkPassword(password))
        reject("BAD_PASSWORD");
      else if(!this.db.checkEmail(email))
        reject("BAD_EMAIL");
      else if(!this.db.checkPhone(phone))
        reject("BAD_PHONE");
      else{
        this.checkUserExists(user).then(
          (exists) => {
            if(exists)
              reject("USER_ALREADY_EXISTS");
            else{
              crypto.hash(password).then(
                (hash) => {
                  if(typeof(hash) !== 'string')
                    reject("ERROR_INTERNAL_HASH_NOT_STRING");
                  else{
                    let using_code = true;
                    if(code == undefined) {code = ""; using_code = false}
                    this.db.query("SELECT * FROM init_config WHERE code = '" + code + "'").then(
                      (code_data) => {
                        if((code_data.rowCount == 0 || (!code_data.rows[0].code_reus && code_data.rows[0].code_uses > 0)) && using_code){
                          reject("INVALID_CODE");
                        }
                        else{
                          let registerQuery = "INSERT INTO users (username, shown_username, password, session_ids, email, phone, chats, permissions_id, password_reset_id) VALUES ('" + user + "','" + shownUser +"','" + hash + "',array[]::bigint[],'" + email + "','" + phone + "',array[]::bigint[]," + config.permissions.USER + ",0) RETURNING id";
                          this.db.query(registerQuery).then(
                            (user_data) => {
                              s3Broker.putObject("profile_images/" + user_data.rows[0].id, config.default_profile_image).then(
                                () => {
                                  if(using_code){
                                    let code_uses = code_data.rows[0].cant_uses;
                                    code_uses++;
                                    let code_chats = code_data.rows[0].chats;
                                    if(typeof code_chats == "string"){
                                      code_chats = Array.from(code_chats);
                                    }
                                    for(let i = 0; i < code_chats.length; i++){
                                      chatBroker.addUser(code_chats[i],parseInt(user_data.rows[0].id)).then(
                                        () => {},
                                        () => {reject(err);}
                                      );
                                    }
                                    this.db.query("UPDATE users SET code = '" + code + "', group_code = " + code_data.rows[0].group_code.toString() + ", user_type = '" + code_data.rows[0].user_type + "' WHERE id = " + user_data.rows[0].id.toString()).then(
                                      () => {
                                        this.db.query("UPDATE init_config SET cant_uses = " + code_uses.toString() + " WHERE code = '" + code + "'").then(
                                          () => {resolve({"id":parseInt(user_data.rows[0].id)});},
                                          (err) => {reject(err);}
                                        )
                                      },
                                      (err) => {reject(err);}
                                    );
                                  }
                                  else{
                                    resolve({"id":parseInt(user_data.rows[0].id)});
                                  }
                                },
                                (err) => {reject(err);}
                              );
                            },
                            (err) => {reject(err);}
                          );
                        }
                      }
                    );
                  }
                },
                (err) => {reject(err);}
              );
            }
          },
          (err) => {reject(err);}
        );
      }
    });
  }
  
  checkUserExists(user){
    return new Promise((resolve, reject) => {
      if(!this.db.checkUser(user))
        reject("BAD_USER");
      else{
        this.db.query("SELECT * FROM users WHERE username = '" + user + "'").then(
          (result) => {
            resolve(result.rowCount > 0);
          },
          (err) => {reject(err);}
        );
      }
    });
  }
}

module.exports = new RegisterBroker(db);