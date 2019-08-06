'use strict'

class BasicMessenger{
    constructor(){
        this.message = "";
    }

    send(message){
        this.message = message;
    }

    receive(){
        return this.message;
    }
}

module.exports = new BasicMessenger();