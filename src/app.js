'use strict';
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const {Pool, Client} = require('pg')
var express = require('express');

AWS.config.update({region: 'us-east-1'});
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var s3 = new AWS.S3();

const connData = {
  user: 'postgres',
  host: 'ort-motl-app.cwihmzkvtujm.us-east-1.rds.amazonaws.com',
  database: 'ort_motl_app',
  password: '43442476postgres',
  port: 5432,
};

//const pool = new Pool(connData);
const conn = new Client(connData);

conn.connect();


//SAMPLE UPLOAD
/*
s3.upload({Bucket: 'motl-app', Key: 'testfile.txt', Body: 'S3 file text'}, (err, data) => {
  if (err) throw err;
});
*/

//SAMPLE DOWNLOAD
/*
s3.getObject({Bucket: 'motl-app', Key: 'testfile.txt'}, (err, data) => {
  if (err) reject(err);
  filedata = data.Body.toString();
});
*/

//SAMPLE QUERY
/*
conn.query('SELECT * FROM users', (err, result) => {
  if (err) reject(err);
  res = result;
});
*/

function homepage(req, res, next){
  res.writeHeader(200, {'Content-Type': 'text/plain'});
  res.write('Hello ORT!\n\nTHIS IS A TEST PAGE, NOTHING TO DO HERE\n\n');
  new Promise((resolve, reject) => {
    let usersLocated = [];
    conn.query('SELECT * FROM users', (err, result) => {
      if (err) return reject(err);
      result.rows.forEach(element => {
        usersLocated.push(element.shown_username);
      });
      return resolve(usersLocated);
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
        s3.getObject({Bucket: 'motl-app', Key: 'testfile.txt'}, (err, data) => {
          if (err) return reject(err);
          return resolve(data.Body.toString());
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
app.get('/', homepage, (req,res) => {});

function getPublicFile(req, res, next){
  new Promise((resolve, reject) => {
    s3.getObject({Bucket: 'motl-app', Key: req.params.filename}, (err, data) => {
      if (err) return reject(err);
      return resolve(data.Body.toString());
    });
  }).then(
    (filedata) => {
      return new Promise((resolve, reject) => {
        res.writeHeader(200, {'Content-Type': 'text/plain'});
        res.write(filedata);
        return resolve(0);
      });
    },
    (error) => {
      return new Promise((resolve, reject) => {
        res.writeHeader(404, {'Content-Type': 'text/plain'});
        res.write(' ');
        return resolve(404);
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
app.get('/public-files/:filename', getPublicFile, (req,res) => {});

function test(req, res, next){
  res.writeHeader(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({'cookie' : '0123456789abcdef'}));
}

app.get('/test', test, (req,res) => {});

app.listen(80);
