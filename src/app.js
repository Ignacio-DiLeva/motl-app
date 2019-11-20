"use strict";
let config = require('./config');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const multer = require("multer");
var upload = multer({ dest: 'uploads/' });
const cookieParser = require('cookie-parser');
const {Pool, Client} = require('pg');
var express = require('express');
var fs = require("fs");

const loginBroker = require("./LoginBroker");
const registerBroker = require('./RegisterBroker');
const passwordResetRequestBroker = require("./PasswordResetRequestBroker");
const passwordResetSubmitBroker = require("./PasswordResetSubmitBroker");
const assistanceBroker = require("./AssistanceBroker");
const postBroker = require("./PostsBroker");
const chatBroker = require("./ChatBroker");

AWS.config.update({region: 'us-east-1'});
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(config.cookieSecret));
var s3 = new AWS.S3();

//const pool = new Pool(connData);
const conn = new Client(config.connData);

conn.connect();


function rootPage(req, res, next){
  res.writeHeader(200, {'Content-Type': 'text/plain'});
  res.write('Hello ORT!\n\nTHIS IS A TEST PAGE, NOTHING TO DO HERE\n\n');
  new Promise((resolve, reject) => {
    let usersLocated = [];
    conn.query('SELECT * FROM users', (err, result) => {
      if (err) return reject(err);
      else{
        result.rows.forEach(element => {
          usersLocated.push(element.shown_username);
        });
        return resolve(usersLocated);
      }
    });
  }).then(
    (users) => {
      return new Promise((resolve, reject) => {
        res.write('USERS IN TABLE:\n----\n');
        users.forEach((user) => {
          res.write(user + '\n');
        });
        res.write('----\n\n');
        return resolve(0);
      });
    },
    (error) => {
      return new Promise((resolve, reject) => {
        res.write('CAN NOT ACCESS USERS\n\n');
        return resolve(500);
      });
    }
  ).then(
    (result) => {
      return new Promise((resolve, reject) => {
        s3.getObject({Bucket: config.bucketName, Key: 'testfile.txt'}, (err, data) => {
          if (err) return reject(err);
          else return resolve(data.Body.toString());
        });
      });
    }
  ).then(
    (filedata) => {
      return new Promise((resolve, reject) => {
        res.write('S3 FILE:\n----\n');
        res.write(filedata);
        res.write('\n----\n\n');
        return resolve(0);
      });
    },
    (error) => {
      return new Promise((resolve, reject) => {
        res.write('FAILED TO READ FILE\n\n');
        return resolve(500);
      });
    }
  ).then(
    () => {
      return new Promise((resolve, reject) => {
        res.end();
        next();
        return resolve(0);
      });
    }
  );
}
app.get('/', rootPage, (req,res) => {});

function login(req, res, next){
  loginBroker.login(req.body.username, req.body.password, req.cookies["ORT_MOTL_APP"]).then(
    (user_data) => {
      //res.cookie("ORT_MOTL_APP", user_data.cookie, config.cookieConfig);
      res.writeHeader(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({'_code' : "SUCCESS", "id":user_data.id}));
    },
    (err) => {
      res.writeHeader(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({'_code' : "INTERNAL_ERROR"}));
    }
  );
}

app.post('/login', login, (req,res) => {});

function register(req, res, next){
  /*
  if(!!req.cookies["ORT_MOTL_APP"]){
    res.writeHeader(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({'_code' : "ERROR_USER_ALREADY_LOGGED_IN"}));
  }
  */
  registerBroker.register(req.body.username, req.body.shown_username, req.body.password, req.body.email, req.body.phone).then(
    (user_data) => {
      //res.cookie("ORT_MOTL_APP", user_data.cookie, config.cookieConfig);
      res.writeHeader(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({'_code' : "SUCCESS", "id":user_data.id}));
    },
    (err) => {
      res.writeHeader(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({'_code' : err.toString()}));
    }
  );
}

app.post('/register', register, (req,res) => {});

function passwordResetRequest(req, res, next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  passwordResetRequestBroker.requestReset(req.body.username).then(
    () => {res.end(JSON.stringify({'_code' : "SUCCESS"}));},
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post('/password-reset-request', passwordResetRequest, (req,res) => {});

function passwordResetSubmit(req, res, next){
  passwordResetSubmitBroker.submitReset(req.body.username, req.body.code, req.body.new_password).then(
    (cookie) => {
      //res.cookie("ORT_MOTL_APP", cookie, config.cookieConfig);
      res.writeHeader(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({'_code' : "SUCCESS"}));
    },
    (err) => {
      res.writeHeader(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({'_code' : err}));
    }
  );
}

app.post('/password-reset-submit', passwordResetSubmit, (req,res) => {});z

app.post('/submit-post', upload.single("file"), (req, res, next) => {
  res.writeHeader(200, {'Content-Type': 'application/json'});
  fs.readFile(req.file.path, (err, data) => {
    if(err)
      res.end(JSON.stringify({'_code' : err}));
    else{
      postBroker.submitPost(req.body.section,req.body.name,req.body.user,data, req.body.description).then(
        () => {res.end(JSON.stringify({'_code' : "SUCCESS"}));},
        (err) => {res.end(JSON.stringify({'_code' : err}));}
      );
    }
  });
});


function submitComment(req,res,next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  postBroker.submitComment(req.body.post_id,req.body.user,req.body.comment).then(
    () => {res.end(JSON.stringify({'_code' : "SUCCESS"}));},
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post('/submit-comment', submitComment, (req,res) => {});

function getPost(req,res,next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  postBroker.getPostById(req.body.id).then(
    (post) => {res.end(JSON.stringify({'_code' : "SUCCESS", data:post}));},
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post('/get-post', getPost, (req,res) => {});

function postDiscovery(req,res,next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  postBroker.postDiscovery(req.body.section,req.body.number,req.body.user, req.body.no_content).then(
    (posts) => {
      res.end(JSON.stringify({'_code' : "SUCCESS", data:posts}));
    },
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post('/post-discovery', postDiscovery, (req,res) => {});

function assistanceDiscovery(req,res,next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  assistanceBroker.listLogs(req.body.user).then(
    (result) => {res.end(JSON.stringify({'_code' : "SUCCESS", logs:result}));},
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post('/assistance-discovery', assistanceDiscovery, (req,res) => {});

function getAssistanceLog(req,res,next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  assistanceBroker.getLog(req.body.id).then(
    (result) => {res.end(JSON.stringify({'_code' : "SUCCESS", data:result}));},
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post('/get-assistance-log', getAssistanceLog, (req,res) => {});

function createAssistanceLog(req,res,next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  assistanceBroker.createLog(
    {
      user:req.body.user,
      location:req.body.location,
      activity:req.body.activity,
      status:req.body.status}
    ).then(
    (result) => {res.end(JSON.stringify({'_code' : "SUCCESS", id:result}));},
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post('/create-assistance-log', createAssistanceLog, (req,res) => {});

function updateAssistanceLog(req,res,next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  assistanceBroker.setLog(
    req.body.id,
    {
      user:req.body.user,
      location:req.body.location,
      activity:req.body.activity,
      status:req.body.status}
    ).then(
    () => {res.end(JSON.stringify({'_code' : "SUCCESS"}));},
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post('/update-assistance-log', updateAssistanceLog, (req,res) => {});

function hilsenGet1(req, res, next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({"users":[{"name":"Michelle Castro","userName":"micastro","picture":"http://blogspay.com/wp-content/uploads/2018/07/istock-526142422.jpg","id":1},{"name":"Carol Faria","userName":"carolf","picture":"https://www.doctorulzilei.ro/wp-content/uploads/2014/02/stretching-3.jpg","id":2},{"name":"Monica Nishi","userName":"nishim","picture":"https://www.sss.gov/portals/0/Images/Women-and-the-Draft.jpg","id":3}]}
  ));
}

app.post('/get-sample1', hilsenGet1, (req,res) => {});

function chatDiscovery(req,res,next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  chatBroker.chatDiscovery(req.body.user).then(
    (result) => {res.end(JSON.stringify({'_code' : "SUCCESS", "chats" : result}));},
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post("/chat-discovery", chatDiscovery, (req,res) => {});


function getMessages(req,res,next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  chatBroker.getMessages(req.body.chat_id).then(
    (result) => {res.end(JSON.stringify({'_code' : "SUCCESS", "messages" : result}));},
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post("/get-messages", getMessages, (req,res) => {});

function addUser(req,res,next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  chatBroker.addUser(req.body.chat_id, req.body.user).then(
    () => {res.end(JSON.stringify({'_code' : "SUCCESS"}));},
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post("/add-user", addUser, (req,res) => {});

function removeUser(req,res,next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  chatBroker.removeUser(req.body.chat_id, req.body.user).then(
    () => {res.end(JSON.stringify({'_code' : "SUCCESS"}));},
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post("/remove-user", removeUser, (req,res) => {});

function createChat(req,res,next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  chatBroker.createChat(req.body.chat_name, req.body.users).then(
    (result) => {res.end(JSON.stringify({'_code' : "SUCCESS", "id" : result}));},
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post("/create-chat", createChat, (req,res) => {});

function changeChatName(req,res,next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  chatBroker.changeName(req.body.chat_id, req.body.chat_name).then(
    () => {res.end(JSON.stringify({'_code' : "SUCCESS"}));},
    (err) => {res.end(JSON.stringify({'_code' : err}));}
  );
}

app.post("/change-chat-name", changeChatName, (req,res) => {});

app.post('/submit-message', upload.single("file"), (req, res, next) => {
  res.writeHeader(200, {'Content-Type': 'application/json'});
  if(req.body.content_type != "text"){
    fs.readFile(req.file.path, (err, data) => {
      if(err)
        res.end(JSON.stringify({'_code' : err}));
      else{
        chatBroker.submitMessage(req.body.chat_id,req.body.author,req.body.content_type,data,req.body.flags).then(
          () => {res.end(JSON.stringify({'_code' : "SUCCESS"}));},
          (err) => {res.end(JSON.stringify({'_code' : err}));}
        );
      }
    });
  }
  else{
    chatBroker.submitMessage(req.body.chat_id,req.body.author,req.body.content_type,req.body.content,req.body.flags).then(
      () => {res.end(JSON.stringify({'_code' : "SUCCESS"}));},
      (err) => {res.end(JSON.stringify({'_code' : err}));}
    );
  }
});

app.listen(80);
