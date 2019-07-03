const fetch = require("node-fetch");

let host = "http://ec2-54-167-191-182.compute-1.amazonaws.com"

function getGeneralHeaders() {
    return {
        "headers" : {
            "Content-Type" : "application/x-www-form-urlencoded",
            "Accept" : "*/*",
            "Cache-Control" : "no-cache",
            "Host" : "ec2-54-167-191-182.compute-1.amazonaws.com",
            "Connection" : "keep-alive"
        }
    };
}

function getRegisterOpts(user, shown, pass, mail, phone) {
    let g = getGeneralHeaders();
    g.method = "POST";
    g.body = {
        "data" : [
            {"username" : user},
            {"shown_username" : shown},
            {"password" : pass},
            {"email" : mail},
            {"phone" : phone}
        ]   
    };
    return g;
}

function getLoginOpts(user, pass, cookie) {
    let g = getGeneralHeaders();
    if(!!cookie)
        g.headers.cookie = cookie;
    g.method = "POST";
    g.body = {
        "data" : [
            {"username" : user},
            {"password" : pass},
        ]
    };
    return g;
}

function getPWRROpts(user) {
    let g = getGeneralHeaders();
    g.method = "POST";
    g.body = {
        "data" : [
            {"username" : user},
        ]
    };
    return g;
}

function getPWRSOpts(user, code, pass){
    let g = getGeneralHeaders();
    g.method = "POST";
    g.body = {
        "data" : [
            {"username" : user},
            {"code"  : code},
            {"new_password" : pass}
        ]
    };
    return g;
}

function getCookieOfRequest(response) {
    return response.headers.get('set-cookie');
}


function runTest(url, opts){
    return new Promise((resolve, reject) => {
        fetch(host + url , opts).then(
            (response) => {
                resolve(response);
            },
            (err) => {reject(err);}
        );
    });
}

console.log(getRegisterOpts("43442476", "NachoDL", "hunter12", "ignaciodileva@gmail.com", "+5491112345678"));

console.log(getLoginOpts("43442476", "hunter12", null));

console.log(getPWRROpts("43442476"));

console.log(getPWRSOpts("43442476", "RECOVERY_CODE", "hunter1234"));

let r = runTest("/register",getRegisterOpts("43442476", "NachoDL", "hunter12", "ignaciodileva@gmail.com", "+5491112345678"));

console.log("----\n");

r.then(
    (response) => {
        response.json().then(
            (returned_json) => {
                console.log(returned_json);
            },
            (err) => {console.error(err);}
        ).then(
            () => {
                console.log(getCookieOfRequest(response));
            }
        )
    },
    (err) => {console.error(err);}
);

