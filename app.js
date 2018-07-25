const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors');
const morgan = require('morgan');
const request = require('request');
const app = express()
const port = process.env.PORT || 4000
const r = require("rethinkdb");
const rdb = 'iw';
const rhost = 'iw.mappico.co.th';
const rport = 28015;
var state = true;
var user = [];

var http = require("http");
setInterval(function () {
    http.get("http://mpclinebot.herokuapp.com");
}, 300000);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors());
app.use(morgan('combined'))
app.post('/webhook', (req, res) => {
    let reply_token = req.body.events[0].replyToken
    let msg = req.body.events[0].message.text
    var uid = req.body.events[0].source.userId
    if (msg) {
        var areEqual = msg.toUpperCase();
    } else {
        areEqual = 'test'
    }

    //reply(reply_token,msg)
    res.sendStatus(200)


    if (areEqual == 'RESUME') {
        if (!user.includes(uid)) {
            user.push(uid);
        }
        console.log('line48' + user)
        send(uid, 'Resume monitoring. . .')
    } else if (areEqual == 'PAUSE') {
        for (var i = user.length - 1; i >= 0; i--) {
            if (user[i] === uid) {
                user.splice(i, 1);
                console.log('line54' + user)
            }
        }
        send(uid, 'Pause monitoring. . .')
    } else if (areEqual == 'FLEX') {
        console.log("lol")
        //flex(reply_token,flex_msg)
    }


});
app.listen(port);
console.log('Server is listening on ' + port);

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------
r.connect({
    host: rhost,
    port: rport,
    db: rdb
}).then(function (conn) {
    r.table('inAlert').changes().run(conn, function (err, cursor) {

        if (err) {
            console.log(err)
        } else {
            cursor.each(function (err, results) {
                if (err) {
                    console.log(err);
                } else {
                    //console.log(state)
                    if (results.new_val != null) {
                        // console.log(results.new_val);
                        let id = JSON.stringify(results.new_val.id);
                        // console.log(id);
                        let area_name = JSON.stringify(results.new_val.polygon.properties.name);
                        // console.log(area_name);
                        let lat = parseFloat(JSON.stringify(results.new_val.polygon.properties.centroid[1]));
                        // console.log(lat);
                        let lng = parseFloat(JSON.stringify(results.new_val.polygon.properties.centroid[0]));
                        // console.log(lng);
                        let dt = JSON.stringify(results.new_val.timestamp);
                        // let u = JSON.stringify(results.new_val.user);
                        if (user.length > 0) {
                            //console.log(user.length)
                            for (let i = 0; i < user.length; i++) {
                                alert(user[i], id, name, lat, lng, dt);
                                //console.log(type+" "+title+" "+lat+" "+lng+" "+user)
                            }
                        }
                    }
                }
            });
        }
    });
});

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------

function reply(reply_token, msg) {
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {Ixpgkyy5oDrICl/bPZjIF7RsqfKKLmtqUXcSCgFlBzwir6g62x4PFjgxyEH49ERpgsvNkPM/3YyFqTfhhy4UdKWE9l4tLcimW3Sxxdz9cuTFG/UUcn9OefiGDohdjtUKDQ4xQeevbYY8yT4T0+gZXwdB04t89/1O/w1cDnyilFU=}'
    }
    let body = JSON.stringify({
        replyToken: reply_token,
        messages: [{
            type: 'text',
            text: msg
        }]
    })
    request.post({
        url: 'https://api.line.me/v2/bot/message/reply',
        headers: headers,
        body: body
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
    });
}

function alert(reply_token, id, name, lat, lng, dt) {
    console.log(reply_token + id + name + lat + lng + dt)
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {Ixpgkyy5oDrICl/bPZjIF7RsqfKKLmtqUXcSCgFlBzwir6g62x4PFjgxyEH49ERpgsvNkPM/3YyFqTfhhy4UdKWE9l4tLcimW3Sxxdz9cuTFG/UUcn9OefiGDohdjtUKDQ4xQeevbYY8yT4T0+gZXwdB04t89/1O/w1cDnyilFU=}'
    }
    let body = JSON.stringify({
        to: reply_token,
        messages: [{
            "type": "location",
            "title": id + ": get in " + name + " at " + dt,
            "address": lat + "," + lng,
            "latitude": lat,
            "longitude": lng
        }]
    });
    request.post({
        url: 'https://api.line.me/v2/bot/message/push',
        headers: headers,
        body: body
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
    });
}

function send(user, word) {
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {Ixpgkyy5oDrICl/bPZjIF7RsqfKKLmtqUXcSCgFlBzwir6g62x4PFjgxyEH49ERpgsvNkPM/3YyFqTfhhy4UdKWE9l4tLcimW3Sxxdz9cuTFG/UUcn9OefiGDohdjtUKDQ4xQeevbYY8yT4T0+gZXwdB04t89/1O/w1cDnyilFU=}'
    }
    let body = JSON.stringify({
        to: user,
        messages: [{
            "type": "text",
            "text": word
        }]
    });
    request.post({
        url: 'https://api.line.me/v2/bot/message/push',
        headers: headers,
        body: body
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
    });
}