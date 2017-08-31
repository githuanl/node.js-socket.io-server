var vfMessage = require('../entity/Message.js');

var timeoutCallback = require('timeout-callback');
var request =  require('./request.js');
var fs = require('fs');
var path = require('path');
var videoChat = require('./videoChat');
// var pub = vfglobal.redis.createClient({
//         host: '192.168.0.208',
//         port: 6379
//     });
// var sub = vfglobal.redis.createClient({
//         host: '192.168.0.208',
//         port: 6379
//     });

// sub.on('error', function (err) {
//     vfglobal.MyLog('error event - ' + sub.host + ':' + sub.port + ' - ' + err);
// });
//
// sub.on('connect', function (err) {
//    vfglobal.MyLog('---------------连接成功------------');
// });
//
// sub.on("subscribe", function(channel, count) {
//     vfglobal.MyLog("Subscribed to " + channel + ". Now subscribed to " + count + " channel(s).");
// });
//
//
// sub.on("message", function(channel, message) {
//      vfglobal.MyLog("这是个通知消息" + channel + ": " + message);
//      vfglobal.io.emit("notification", {'message': message});
// });
//
// sub.subscribe("tungns");
//
// //setInterval
// setTimeout(function() {
//     var no = Math.floor(Math.random() * 100);
//     pub.publish('tungns', 'Generated Chat random no ' + no);
// }, 5000);


//ios 推送消息
var apn = require('apn');

// token 数组
let tokens = ["431b9699945a0fa11e692f9a281e3be5deec70ea61c8530aef7efbcc098b7e71"];

let service = new apn.Provider({
    token: {
        key: './config/AuthKey.p8', // Path to the key p8 file
        keyId: 'SXZZL6BZ83', // The Key ID of the p8 file (available at https://developer.apple.com/account/ios/certificate/key)
        teamId: '5HBP8N48W6', // The Team ID of your Apple Developer Account (available at https://developer.apple.com/account/#/membership/)
    },
    production: false // Set to true if sending a notification to a production iOS app
});

let note = new apn.Notification();
// 主题 一般取应用标识符（bundle identifier）
note.topic = "cn.vifulink.vifu";
note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
note.badge = 1;
note.sound = "ping.aiff";
note.alert = "消息推送啊";
note.payload = {'messageFrom': 'John Appleseed', 'test': 'test'};

service.send(note, tokens).then(result => {
    vfglobal.MyLog("sent:", result.sent.length);
    vfglobal.MyLog("failed:", result.failed.length);
});
service.shutdown();


function sendAPNS(msg) {

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 1;
    note.sound = "ping.aiff";
    note.alert = msg.bodies.msg;
    note.payload = {'messageFrom': 'John Appleseed'};
    service.send(note, tokens).then(result => {
        vfglobal.MyLog("sent:", result.sent.length);
        // vfglobal.MyLog("failed:", result.failed.length);
    });
}

var chat = function (io) {

    var vfUser = require('../entity/User.js');
    var vfGroup = require('../entity/Group.js');
    var vfGroupUser = require('../entity/GroupUser.js');

    // 拦截操作 通过 token
    io.set("authorization", function (handshakeData, callback) {

        // vfglobal.MyLog(handshakeData.url);
        // vfglobal.MyLog(handshakeData.headers);
        // vfglobal.MyLog(handshakeData._query);
        var token = handshakeData._query.auth_token;
        // vfglobal.MyLog(token+"----token");
        // vfglobal.MyLog(vfglobal.token_Map);
        if (vfglobal.isLogin > 0 || (token && vfglobal.token_Map.hasOwnProperty(token))) {    //说明存在
            callback(null, true);
        } else {
            if (!token) {                 //不存在token 拦截
                callback({data: '不存在token时不能连接'}, false);
                vfglobal.MyLog('拦截连接了');
            } else {
                //查询是否存在
                vfUser.User.find({"auth_token": token}, function (err, result) {
                    var user = result[0]; //user这个变量是一个User的实例。
                    // vfglobal.MyLog(user);
                    if (user) {
                        vfglobal.token_Map[token] = user.name;
                        callback(null, true);
                        // vfglobal.MyLog('查询后放行 >> 放行连接');
                    } else {
                        callback(null, false);      //不存在的token时需要 拦截
                        // vfglobal.MyLog('查询后拦截 >> 拦截连接了');
                    }
                });
            }
        }

        // vfglobal.MyLog(handshakeData.rawHeaders);
        // vfglobal.MyLog(handshakeData.socket._peername);
        // vfglobal.MyLog(handshakeData.client._peername);
    });

    io.on('connection', function (socket) {

        var token = socket.handshake.query.auth_token;

        var userName = vfglobal.token_Map[token];

        vfglobal.MyLog("------------------------->" + userName + ' 上线了 上线时间：' + new Date().toLocaleString());

        socket.broadcast.emit('onLine', {'user': userName});

        vfglobal.socket_Map[userName] = socket;  //将用户对应的 socket 存起来

        vfGroupUser.findAll(userName, function (data) {  //查询当前人 加入的所有群

            data.findIndex(function (T, number, data) {
                socket.join(T.group_name);
                vfglobal.MyLog("加入群：", T.group_name + " " + new Date().toLocaleString());
            });

        });

        //https://stackoverflow.com/questions/27055989/socket-io-1-0-x-get-socket-by-id
        //For 0.9 its io.sockets.sockets[socketId] and not io.sockets.socket[socketId]  搜索关键词：socket.io socket.id find
        // vfglobal.MyLog(io.sockets.connected[socket.id] === socket);
        // vfglobal.MyLog(io.sockets.sockets[socket.id] === socket);
//        if(!vfglobal.allUser[userName]){
//            vfglobal.allUser.push(userName);
//        }

        // vfglobal.MyLog(socket.handshake.headers);
        // 整个系统 级的聊天
        socket.on('liaotian', function (msg) {
            //把接收到的msg原样广播
            socket.broadcast.emit("liaotian", msg);
        });

        // socket.on('pong', function() {
        //     console.log("pong", new Date().toString());
        //     var to = setTimeout(function(){

        //         console.log("ping", new Date().toString());
        //         socket.emit('ping');
        //         clearTimeout(to)

        //     },20000);
        //  });


        // 单聊
        socket.on('chat', function (message, callback) {


            var messageBody = message.bodies;

            // 发送图片
            if (messageBody.type == 'img') {
                
                var imageBuffer = messageBody.fileData;
                var imageName = messageBody.fileName;
                var imageType = path.extname(imageName);
                var uuid = vfglobal.util.generateUUID();
                var newImageName = uuid + imageType;
                fs.writeFile("./public/images/chatImages/" + newImageName, imageBuffer, function(err) {
                    if(err) {vfglobal.MyLog(err)}
                    else {
                        message.bodies.fileRemotePath = "images/chatImages/" + newImageName;
                        message.bodies.fileData = null;
                        sendMessage(message, callback, imageBuffer);
                    }
                });
            }
            else if (messageBody.type == 'audio') {
                var audioBuffer = messageBody.fileData;
                var audioName = messageBody.fileName;
                var audioType = path.extname(audioName);
                var uuid = vfglobal.util.generateUUID();
                var newAudioName = uuid + audioType;
                fs.writeFile("./public/audios/" + newAudioName, audioBuffer, function (err) {
                    if (err){vfglobal.MyLog(err)}
                    else {
                        message.bodies.fileRemotePath = "audios/" + newAudioName;
                        message.bodies.fileData = null;
                        sendMessage(message, callback);
                    }
                })
            }
            // 发送定位
            else if(messageBody.type == 'loc') {

                var url = 'http://restapi.amap.com/v3/staticmap?location=' + messageBody.longitude + ',' + messageBody.latitude + '&zoom=15&size=400*200&markers=mid,,A:' + messageBody.longitude + ',' + messageBody.latitude + '&key=99ad10a03744945e206a837dc61d58fa'
                request.GetRequest(url, function (err, res) {
                    if (err) { // 高德后台请求区域图片失败

                    } else { // 高德后台响应

                        // 图片数据
                        var imgData = '';
                        // 响应的是否为图片
                        var contentType = res.headers['content-type'];
                        var isBackImg = contentType.indexOf("image") >= 0;

                        res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
                        res.on("data", function (chunk) {

                            imgData += chunk;
                        });

                        res.on("end", function () {
                            if (isBackImg) {    // 返回为图片，保存图片
                                var uuid = vfglobal.util.generateUUID();
                                var imageFileName = uuid + '.PNG';
                                fs.writeFile("./public/images/mapImages/" + imageFileName, imgData, "binary", function(err){
                                    if(err){
                                        vfglobal.MyLog("down fail" + err);
                                    }
                                    else {
                                        vfglobal.MyLog("down success");
                                        message.bodies.fileRemotePath = "images/mapImages/" + imageFileName;
                                        sendMessage(message, callback);
                                    }

                                });
                            }
                        });
                    }
                });
            }
            else {
                sendMessage(message, callback);
            }
        });

        /* 创建视频聊天房间 */
        videoChat.scanVideoChat(socket);

        socket.on('videoChat', function (data, callback) {


            // 生成一个房间号
            var room = vfglobal.util.generateUUID();
            if (callback) { // 将房间号发送给聊天的双方

                callback(room);

                var targetSocket = vfglobal.socket_Map[data.to_user];
                if (targetSocket) {
                    targetSocket.emit('videoChat', {"from_user":data.from_user, "room":room}, timeoutCallback(function (timeout, data) {   //用其自身连接给自己发消息

                        if (timeout) {
                            vfglobal.MyLog('消息发送超时，转APNS');
                            // sendAPNS(msg);
                        } else {
                            vfglobal.MyLog(msg.to_user +' -->> '+ data);
                        }

                    }));
                }

            }


        });


        //加入群
        socket.on('join', function (data, callback) {

            if (callback) callback(data.roomId);        // 反馈 服务器收到了消息

            vfGroup.joinGroup(userName, data.roomId, function (res) {

                if (res === "") { //说明群存在
                    socket.join(data.roomId);
                    vfglobal.MyLog("加入群： " + data.roomId);
                    io.sockets.in(data.roomId).emit('GroupChat', data);
                } else {
                    vfglobal.MyLog("群不存在： " + data.roomId);
                }
            });
        });

        //创建群
        socket.on('create', function (data, callback) {

            if (callback) callback(data.roomId);        // 反馈 服务器收到了消息

            vfGroup.create(userName, data.roomId, function (callBack) {
                socket.join(data.roomId);
                io.sockets.in(data.roomId).emit('GroupChat', data);

            });
        });

        //退群
        socket.on('leave', function (data, callback) {

            vfGroup.leave(userName, data.roomId, function (callBack) {
                vfglobal.MyLog('离开了群：', data.roomId);
            });
            socket.leave(data.roomId);
        });

        //群聊天
        socket.on('GroupChat', function (data, callback) {
//              //不包括自己
//              socket.broadcast.to('group1').emit('event_name', data);
            //包括自己
            vfglobal.MyLog('给群 ' + data.roomId + " 发消息");
            io.sockets.in(data.roomId).emit('GroupChat', data);
        });

        // 用户下线
        socket.on('disconnect', function () {
            var userName = vfglobal.token_Map[token];
            // vfglobal.MyLog(vfglobal.allUser);
            vfglobal.MyLog(userName + '下线了 下线时间：' + new Date().toLocaleString());
            io.emit("offLine", {'user': userName});
            vfglobal.allUser.findIndex(function (T, number, arr) {
                if (T == userName) {
                    vfglobal.allUser.splice(number, 1);
                }
            });
        });

        /*保存数据库，消息应答，消息转发*/
        function sendMessage(message, callback, fileData) {
            vfMessage.save(message, function (msg) { //将数据保存到数据库

                if (callback) {     //ack 回调 服务器已收到消息
                    callback(msg);
                }
                // io.emit('chat', msg);              // 所有人收的到
                var to_user = msg.to_user;
                if (vfglobal.socket_Map.hasOwnProperty(to_user)) {    //私聊
                    var voIo = vfglobal.socket_Map[to_user];//取出对应的io
                    msg.bodies.fileData = fileData;
                    voIo.emit('chat', msg, timeoutCallback(function (timeout, data) {   //用其自身连接给自己发消息

                        if (timeout) {
                            vfglobal.MyLog('消息发送超时，转APNS');
                            sendAPNS(msg);
                        } else {
                            vfglobal.MyLog(msg.to_user + ' -->> ' + data);
                        }

                    }));
                } else {
                    vfglobal.MyLog(to_user + "---已经下线了, 转APNS");
                    sendAPNS(msg);
                }
            });
        }
    });

    // setInterval(function() {
    //    io.emit('ping', { beat : 1 });
    // }, 5000);
}
module.exports = chat;
