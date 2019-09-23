let config = require('./config');
let AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

class S3Broker {
  constructor(){
    this.s3 = new AWS.S3();
  }

  putObject(name, content){
    return new Promise((resolve, reject) => {
      this.s3.upload({Bucket: config.bucketName, Key: name, Body: content}, (err) => {
        if(err) reject(err);
        else resolve('SUCCESS');
      });
    });
  }

  getObject(name){
    return new Promise((resolve, reject) => {
      this.s3.getObject({Bucket: config.bucketName, Key: name}, (err, data) => {
        if (err) return reject(err);
        else return resolve(data.Body);
      });
    });
  }
}

module.exports = new S3Broker();
