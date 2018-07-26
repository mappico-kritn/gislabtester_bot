const line = require('@line/bot-sdk');
const express = require('express');
const request = require('request');
const moment = require('moment-timezone');
const r = require("rethinkdb");
const rdb = 'iw';
const rhost = 'iw.mappico.co.th';
const rport = 28015;
var state = true;
var user = [];
var http = require("http");
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

setInterval(function () {
    http.get("http://mpclinebot.herokuapp.com");
}, 300000);
// listen on port
const port = process.env.PORT || 3000;
// create Express app
// about Express itself: https://expressjs.com/
const app = express();
app.listen(port, () => {
    console.log(`listening on ${port}`);
});

// create LINE SDK config from env variables
const config = {
    channelAccessToken: 'Ixpgkyy5oDrICl/bPZjIF7RsqfKKLmtqUXcSCgFlBzwir6g62x4PFjgxyEH49ERpgsvNkPM/3YyFqTfhhy4UdKWE9l4tLcimW3Sxxdz9cuTFG/UUcn9OefiGDohdjtUKDQ4xQeevbYY8yT4T0+gZXwdB04t89/1O/w1cDnyilFU=',
    channelSecret: '6c9bb109c5c83f13d8a99ff0cd357d71',
};

// base URL for webhook server
const baseURL = 'https://mpclinebot.herokuapp.com';

// create LINE SDK client
const client = new line.Client(config);

// serve static and downloaded files
app.use('/static', express.static('static'));
app.use('/downloaded', express.static('downloaded'));

// webhook callback
app.post('/webhook', line.middleware(config), (req, res) => {
    // req.body.events should be an array of events
    if (!Array.isArray(req.body.events)) {
        return res.status(500).end();
    }

    // handle events separately
    Promise.all(req.body.events.map(handleEvent))
        .then(() => res.end())
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

// simple reply function
const replyText = (token, texts) => {
    texts = Array.isArray(texts) ? texts : [texts];
    return client.replyMessage(
        token,
        texts.map((text) => ({
            type: 'text',
            text
        }))
    );
};

// callback function to handle a single event
function handleEvent(event) {
    switch (event.type) {
        case 'message':
            const message = event.message;
            switch (message.type) {
                case 'text':
                    return handleText(message, event.replyToken, event.source);
                case 'image':
                    return handleImage(message, event.replyToken);
                case 'video':
                    return handleVideo(message, event.replyToken);
                case 'audio':
                    return handleAudio(message, event.replyToken);
                case 'location':
                    return handleLocation(message, event.replyToken);
                case 'sticker':
                    return handleSticker(message, event.replyToken);
                default:
                    throw new Error(`Unknown message: ${JSON.stringify(message)}`);
            }

        case 'follow':
            return replyText(event.replyToken, 'Got followed event');

        case 'unfollow':
            return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

        case 'join':
            return replyText(event.replyToken, `Joined ${event.source.type}`);

        case 'leave':
            return console.log(`Left: ${JSON.stringify(event)}`);

        case 'postback':
            let data = event.postback.data;
            if (data === 'DATE' || data === 'TIME' || data === 'DATETIME') {
                data += `(${JSON.stringify(event.postback.params)})`;
            }
            return replyText(event.replyToken, `Got postback: ${data}`);

        case 'beacon':
            return replyText(event.replyToken, `Got beacon: ${event.beacon.hwid}`);

        default:
            throw new Error(`Unknown event: ${JSON.stringify(event)}`);
    }
}

function handleText(message, replyToken, source) {
    const buttonsImageURL = `${baseURL}/static/buttons/1040.jpg`;

    switch (message.text) {
        case 'profile':
            if (source.userId) {
                return client.getProfile(source.userId)
                    .then((profile) => replyText(
                        replyToken, [
                            `Display name: ${profile.displayName}`,
                            `Status message: ${profile.statusMessage}`,
                        ]
                    ));
            } else {
                return replyText(replyToken, 'Bot can\'t use profile API without user ID');
            }
        case 'buttons':
            return client.replyMessage(
                replyToken, {
                    type: 'template',
                    altText: 'Buttons alt text',
                    template: {
                        type: 'buttons',
                        thumbnailImageUrl: buttonsImageURL,
                        title: 'My button sample',
                        text: 'Hello, my button',
                        actions: [{
                                label: 'Go to line.me',
                                type: 'uri',
                                uri: 'https://line.me'
                            },
                            {
                                label: 'Say hello1',
                                type: 'postback',
                                data: 'hello こんにちは'
                            },
                            {
                                label: '言 hello2',
                                type: 'postback',
                                data: 'hello こんにちは',
                                text: 'hello こんにちは'
                            },
                            {
                                label: 'Say message',
                                type: 'message',
                                text: 'Rice=米'
                            },
                        ],
                    },
                }
            );
        case 'confirm':
            return client.replyMessage(
                replyToken, {
                    type: 'template',
                    altText: 'Confirm alt text',
                    template: {
                        type: 'confirm',
                        text: 'Do it?',
                        actions: [{
                                label: 'Yes',
                                type: 'message',
                                text: 'Yes!'
                            },
                            {
                                label: 'No',
                                type: 'message',
                                text: 'No!'
                            },
                        ],
                    },
                }
            )
        case 'carousel':
            return client.replyMessage(
                replyToken, {
                    type: 'template',
                    altText: 'Carousel alt text',
                    template: {
                        type: 'carousel',
                        columns: [{
                                thumbnailImageUrl: buttonsImageURL,
                                title: 'hoge',
                                text: 'fuga',
                                actions: [{
                                        label: 'Go to line.me',
                                        type: 'uri',
                                        uri: 'https://line.me'
                                    },
                                    {
                                        label: 'Say hello1',
                                        type: 'postback',
                                        data: 'hello こんにちは'
                                    },
                                ],
                            },
                            {
                                thumbnailImageUrl: buttonsImageURL,
                                title: 'hoge',
                                text: 'fuga',
                                actions: [{
                                        label: '言 hello2',
                                        type: 'postback',
                                        data: 'hello こんにちは',
                                        text: 'hello こんにちは'
                                    },
                                    {
                                        label: 'Say message',
                                        type: 'message',
                                        text: 'Rice=米'
                                    },
                                ],
                            },
                        ],
                    },
                }
            );
        case 'image carousel':
            return client.replyMessage(
                replyToken, {
                    type: 'template',
                    altText: 'Image carousel alt text',
                    template: {
                        type: 'image_carousel',
                        columns: [{
                                imageUrl: buttonsImageURL,
                                action: {
                                    label: 'Go to LINE',
                                    type: 'uri',
                                    uri: 'https://line.me'
                                },
                            },
                            {
                                imageUrl: buttonsImageURL,
                                action: {
                                    label: 'Say hello1',
                                    type: 'postback',
                                    data: 'hello こんにちは'
                                },
                            },
                            {
                                imageUrl: buttonsImageURL,
                                action: {
                                    label: 'Say message',
                                    type: 'message',
                                    text: 'Rice=米'
                                },
                            },
                            {
                                imageUrl: buttonsImageURL,
                                action: {
                                    label: 'datetime',
                                    type: 'datetimepicker',
                                    data: 'DATETIME',
                                    mode: 'datetime',
                                },
                            },
                        ]
                    },
                }
            );
        case 'datetime':
            return client.replyMessage(
                replyToken, {
                    type: 'template',
                    altText: 'Datetime pickers alt text',
                    template: {
                        type: 'buttons',
                        text: 'Select date / time !',
                        actions: [{
                                type: 'datetimepicker',
                                label: 'date',
                                data: 'DATE',
                                mode: 'date'
                            },
                            {
                                type: 'datetimepicker',
                                label: 'time',
                                data: 'TIME',
                                mode: 'time'
                            },
                            {
                                type: 'datetimepicker',
                                label: 'datetime',
                                data: 'DATETIME',
                                mode: 'datetime'
                            },
                        ],
                    },
                }
            );
        case 'imagemap':
            return client.replyMessage(
                replyToken, {
                    type: 'imagemap',
                    baseUrl: `${baseURL}/static/rich`,
                    altText: 'Imagemap alt text',
                    baseSize: {
                        width: 1040,
                        height: 1040
                    },
                    actions: [{
                            area: {
                                x: 0,
                                y: 0,
                                width: 520,
                                height: 520
                            },
                            type: 'uri',
                            linkUri: 'https://store.line.me/family/manga/en'
                        },
                        {
                            area: {
                                x: 520,
                                y: 0,
                                width: 520,
                                height: 520
                            },
                            type: 'uri',
                            linkUri: 'https://store.line.me/family/music/en'
                        },
                        {
                            area: {
                                x: 0,
                                y: 520,
                                width: 520,
                                height: 520
                            },
                            type: 'uri',
                            linkUri: 'https://store.line.me/family/play/en'
                        },
                        {
                            area: {
                                x: 520,
                                y: 520,
                                width: 520,
                                height: 520
                            },
                            type: 'message',
                            text: 'URANAI!'
                        },
                    ],
                }
            );
        case 'resume':
                user.push(source.userId);
                return replyText(replyToken, 'Resumed');
        case 'pause':
                for (var i = user.length - 1; i >= 0; i--) {
                    if (user[i] === source.userId) {
                        user.splice(i, 1);
                        console.log('line54' + user)
                    }
                }
                return replyText(replyToken, 'Paused!');
        case 'bye':
            switch (source.type) {
                case 'user':
                    return replyText(replyToken, 'Bot can\'t leave from 1:1 chat');
                case 'group':
                    return replyText(replyToken, 'Leaving group')
                        .then(() => client.leaveGroup(source.groupId));
                case 'room':
                    return replyText(replyToken, 'Leaving room')
                        .then(() => client.leaveRoom(source.roomId));
            }
        default:
            console.log(`Echo message to ${replyToken}: ${message.text}`);
            return replyText(replyToken, message.text);
    }
}

function handleImage(message, replyToken) {
    const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.jpg`);
    const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);

    return downloadContent(message.id, downloadPath)
        .then((downloadPath) => {
            // ImageMagick is needed here to run 'convert'
            // Please consider about security and performance by yourself
            cp.execSync(`convert -resize 240x jpeg:${downloadPath} jpeg:${previewPath}`);

            return client.replyMessage(
                replyToken, {
                    type: 'image',
                    originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
                    previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath),
                }
            );
        });
}

function handleVideo(message, replyToken) {
    const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.mp4`);
    const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);

    return downloadContent(message.id, downloadPath)
        .then((downloadPath) => {
            // FFmpeg and ImageMagick is needed here to run 'convert'
            // Please consider about security and performance by yourself
            cp.execSync(`convert mp4:${downloadPath}[0] jpeg:${previewPath}`);

            return client.replyMessage(
                replyToken, {
                    type: 'video',
                    originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
                    previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath),
                }
            );
        });
}

function handleAudio(message, replyToken) {
    const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.m4a`);

    return downloadContent(message.id, downloadPath)
        .then((downloadPath) => {
            var getDuration = require('get-audio-duration');
            var audioDuration;
            getDuration(downloadPath)
                .then((duration) => {
                    audioDuration = duration;
                })
                .catch((error) => {
                    audioDuration = 1;
                })
                .finally(() => {
                    return client.replyMessage(
                        replyToken, {
                            type: 'audio',
                            originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath),
                            duration: audioDuration * 1000,
                        }
                    );
                });
        });
}

function downloadContent(messageId, downloadPath) {
    return client.getMessageContent(messageId)
        .then((stream) => new Promise((resolve, reject) => {
            const writable = fs.createWriteStream(downloadPath);
            stream.pipe(writable);
            stream.on('end', () => resolve(downloadPath));
            stream.on('error', reject);
        }));
}

function handleLocation(message, replyToken) {
    return client.replyMessage(
        replyToken, {
            type: 'location',
            title: message.title,
            address: message.address,
            latitude: message.latitude,
            longitude: message.longitude,
        }
    );
}

function handleSticker(message, replyToken) {
    return client.replyMessage(
        replyToken, {
            type: 'sticker',
            packageId: message.packageId,
            stickerId: message.stickerId,
        }
    );
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------
r.connect({
    host: rhost,
    port: rport,
    db: rdb
}).then(function (conn) {
    // In polygon
    r.table('inAlert').changes().run(conn, function (err, cursor) {
        if (err) {
            console.log(err)
        } else {
            cursor.each(function (err, results) {
                if (err) {
                    console.log(err);
                } else {
                    //console.log(state)
                    console.log('Test In alert!!!');
                    if (results.new_val != null) {
                        // console.log(results.new_val);
                        let id = results.new_val.id;
                        // console.log(id);
                        let area_name = results.new_val.polygon.properties.name;
                        // console.log(area_name);
                        let lat = parseFloat(JSON.stringify(results.new_val.polygon.properties.centroid[1]));
                        // console.log(lat);
                        let lng = parseFloat(JSON.stringify(results.new_val.polygon.properties.centroid[0]));
                        // console.log(lng);
                        let dt = JSON.stringify(results.new_val.timestamp);
                        // let u = JSON.stringify(results.new_val.user);

                        r.db(rdb).table('cars').get(id).pluck('car_plate', 'company_name', 'driver_name', 'officer_name', 'car_status').run(conn, function (err, icursor) {
                            var carplate = id;
                            var carstatus = 'red';
                            var company = 'N/A';
                            var driver = 'N/A';
                            var officer = 'N/A';
                            if (icursor != null || icursor != undefined) {
                                carstatus = icursor.car_status;
                                company = icursor.company_name;
                                driver = icursor.driver_name;
                                officer = icursor.officer_name;
                                carplate = icursor.car_plate;
                            } else {
    
                                // console.log('"' + uid + '" car not found!');
                            }
                            var mlc = {
                                'id': id,
                                'carno': carplate,
                                'company': company,
                                'driver': driver,
                                'officer': officer
                            };
                            // console.log(mlc);
                            let inuser = user;
                            if (inuser.length > 0) {
                                //console.log(user.length)
                                for (let i = 0; i < inuser.length; i++) {
                                    inAlert(inuser[i], id, area_name, lat, lng, dt, mlc.carno, mlc.company, mlc.driver, mlc.officer);
                                    //console.log(type+" "+title+" "+lat+" "+lng+" "+user)
                                }
                            }
                        });
                    }
                }
            });
        }
    });

    //Out polygon
    r.table('outAlert').changes().run(conn, function (err, cursor) {
        if (err) {
            console.log(err)
        } else {
            cursor.each(function (err, results) {
                if (err) {
                    console.log(err);
                } else {
                    //console.log(state)
                    console.log('Test out alert!!!');
                    if (results.new_val != null) {
                        // console.log(results.new_val);
                        let id = results.new_val.id;
                        // console.log(id);
                        let area_name = results.new_val.polygon.properties.name;
                        // console.log(area_name);
                        let lat = parseFloat(JSON.stringify(results.new_val.polygon.properties.centroid[1]));
                        // console.log(lat);
                        let lng = parseFloat(JSON.stringify(results.new_val.polygon.properties.centroid[0]));
                        // console.log(lng);
                        let intime = results.new_val.in;
                        intime = toTimeZone(intime, 'Asia/Bangkok');
                        console.log(intime);
                        let outtime = results.new_val.out;
                        outtime = toTimeZone(outtime, 'Asia/Bangkok');
                        console.log(outtime);
                        // let u = JSON.stringify(results.new_val.user);

                        r.db(rdb).table('cars').get(id).pluck('car_plate', 'company_name', 'driver_name', 'officer_name', 'car_status').run(conn, function (err, icursor) {
                            var carplate = id;
                            var carstatus = 'red';
                            var company = 'N/A';
                            var driver = 'N/A';
                            var officer = 'N/A';
                            if (icursor != null || icursor != undefined) {
                                carstatus = icursor.car_status;
                                company = icursor.company_name;
                                driver = icursor.driver_name;
                                officer = icursor.officer_name;
                                carplate = icursor.car_plate;
                            } else {
    
                                // console.log('"' + uid + '" car not found!');
                            }
                            var mlc = {
                                'id': id,
                                'carno': carplate,
                                'company': company,
                                'driver': driver,
                                'officer': officer
                            };
                            console.log(mlc);
                            let outuser = user;
                            console.log(outuser);
                            if (outuser.length > 0) {
                                //console.log(user.length)
                                for (let i = 0; i < outuser.length; i++) {
                                    outAlert(outuser[i], id, area_name, lat, lng, intime, outtime, mlc.carno, mlc.company, mlc.driver, mlc.officer);
                                    //console.log(type+" "+title+" "+lat+" "+lng+" "+user)
                                }
                            }
                        });
                    }
                }
            });
        }
    });
});

function inAlert(reply_token, id, name, lat, lng, dt, carno, company, driver, officer) {
    console.log(reply_token + id + name + lat + lng + dt)
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {Ixpgkyy5oDrICl/bPZjIF7RsqfKKLmtqUXcSCgFlBzwir6g62x4PFjgxyEH49ERpgsvNkPM/3YyFqTfhhy4UdKWE9l4tLcimW3Sxxdz9cuTFG/UUcn9OefiGDohdjtUKDQ4xQeevbYY8yT4T0+gZXwdB04t89/1O/w1cDnyilFU=}'
    }
    let body = JSON.stringify({
        to: reply_token,
        messages: [{
            "type": "location",
            "title": carno + ": arrived at " + name + ' ' + dt + ' ' + company + ' ' + driver + ' ' + officer,
            "address": lat + ", " + lng,
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

function outAlert(reply_token, id, name, lat, lng, intime, outtime, carno, company, driver, officer) {
    console.log(reply_token + id + name + lat + lng + intime + outtime + carno + company + officer);
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {Ixpgkyy5oDrICl/bPZjIF7RsqfKKLmtqUXcSCgFlBzwir6g62x4PFjgxyEH49ERpgsvNkPM/3YyFqTfhhy4UdKWE9l4tLcimW3Sxxdz9cuTFG/UUcn9OefiGDohdjtUKDQ4xQeevbYY8yT4T0+gZXwdB04t89/1O/w1cDnyilFU=}'
    }
    let body = JSON.stringify({
        to: reply_token,
        messages: [{
            "type": "location",
            "title": carno + ": leave " + name + ' In: ' + intime + ', Out: ' + outtime + ' Company: ' + company + ' Driver: ' + driver + ' Officer: ' + officer,
            "address": lat + ", " + lng,
            "latitude": lat,
            "longitude": lng
        }]
    });
    request.post({
        url: 'https://api.line.me/v2/bot/message/push',
        headers: headers,
        body: body
    }, (err, res, body) => {
        if (err) {
            console.log(`Error: ${err}`);
        }
        console.log('status = ' + res.statusCode);
    });
}

function toTimeZone(time, zone) {
    var format = 'YYYY-MM-DD HH:mm:ss ZZ';
    return moment(time, format).tz(zone).format(format);
}