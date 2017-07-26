var vfMessage = require('../entity/Message.js');

//ios 推送消息
var apn = require('apn');
// token 数组
let tokens = ["431b9699945a0fa11e692f9a281e3be5deec70ea61c8530aef7efbcc098b7e71"];

let service = new apn.Provider({
    token: {
        key: './config/AuthKey.p8', // Path to the key p8 file
        keyId: '', // The Key ID of the p8 file (available at https://developer.apple.com/account/ios/certificate/key)
        teamId: '', // The Team ID of your Apple Developer Account (available at https://developer.apple.com/account/#/membership/)
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


var chat = function (io) {

    var vfUser = require('../entity/User.js');

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
            vfglobal.MyLog('放行连接');
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

        vfglobal.MyLog(userName + ' 上线了 上线时间：' + new Date().toLocaleString());

        socket.broadcast.emit('onLine', {'user': userName});
        vfglobal.socket_Map[userName] = socket;  //将用户对应的 socket 存起来

        // vfglobal.MyLog(socket.handshake.headers);
        // 整个系统 级的聊天
        socket.on('liaotian', function (msg) {
            //把接收到的msg原样广播
            socket.broadcast.emit("liaotian", msg);
        });

        // 单聊
        socket.on('chat', function (message, callback) {

            vfMessage.save(message, function (msg) { //将数据保存到数据库

                if (callback) {     //ack 回调 服务器已收到消息
                    callback(msg);
                }
                // io.emit('chat', msg);              // 所有人收的到
                var to_user = msg.to_user;
                if (vfglobal.socket_Map.hasOwnProperty(to_user)) {    //私聊
                    var voIo = vfglobal.socket_Map[to_user];         //取出对应的io
                    voIo.volatile.emit('chat', msg, function (data) {   //用其自身连接给自己发消息
                        vfglobal.MyLog(msg.to_user +' -->> '+ data);
                    });
                } else {
                    vfglobal.MyLog(to_user + "---已经下线了");
                    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                    note.badge = 1;
                    note.sound = "ping.aiff";
                    note.alert = JSON.parse(msg.bodies).msg;
                    note.payload = {'messageFrom': 'John Appleseed'};
                    service.send(note, tokens).then(result => {
                        vfglobal.MyLog("sent:", result.sent.length);
                        // vfglobal.MyLog("failed:", result.failed.length);
                    });
                }
            });
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
    });
}
module.exports = chat;
