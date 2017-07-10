var express = require('express');
var app = express();
//socket.io公式：
var http = require('http').Server(app);
var io = require('socket.io')(http);
var vf_utils = require('./utils/utils.js');

var MyLog = require('./config/MyLog.js');
var db = require('./config/mongoose.js');
var vfMessage = require('./config/Message.js');
var vfUser = require('./config/User.js');

//session公式：
var session = require('express-session');
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

//模板引擎
app.set("view engine", "ejs");
//静态服务
app.use(express.static("./public"));

var alluser = [];

//所有的 token : user
var token_Map = {};

//保存所有的 user ：socket 连接
var socket_Map = {};


//显示首页
app.get("/", function (req, res, next) {
    res.render("index");
});

//用户注册
app.get("/register", function (req, res, next) {
    vfUser.register(res, req);
});


//手机端 登录 
app.get("/mobileLogin", function (req, res, next) {
    vfUser.mobileLogin(res, req, token_Map);
});

var isLogin = -1;
//前台登陆，检查此人是否有用户名，并且昵称不能重复
app.get("/check", function (req, res, next) {
    var userName = req.query.yonghuming;
    if (!userName) {
        res.send("必须填写用户名");
        return;
    }
    if (alluser.indexOf(userName) != -1) {
        res.send("用户名已经被占用");
        return;
    }
    isLogin = 1;
    alluser.push(userName);
    //付给session
    req.session.userName = userName;
    res.redirect("/chat");
});

//聊天室
app.get("/chat", function (req, res, next) {
    //这个页面必须保证有用户名了，
    if (!req.session.userName) {
        res.redirect("/");
        return;
    }
    res.render("chat", {
        "yonghuming": req.session.userName
    });
});


io.on("connection", function (socket) {

    var token = socket.handshake.query.auth_token;

    MyLog(token_Map[token] + '上线了');
    socket_Map[token_Map[token]] = socket;  //将用户对应的 io 存起来

    // 整个系统 级的聊天
    socket.on("liaotian", function (msg) {
        MyLog(msg);
        //把接收到的msg原样广播
        io.emit("liaotian", msg);
    });

    // 单聊
    socket.on("chat", function (msg) {
        var to = msg.to + '';//给谁发消息
        MyLog('--------------------------------------------->');
        MyLog(msg);
        vfMessage.save(msg);   //将数据保存到数据库

        // io.emit('chat', msg);              // 所有人收的到
        if (socket_Map.hasOwnProperty(to)) {    //私聊
            MyLog('私聊发消息');
            var voIo = socket_Map[to];         //取出对应的io
            voIo.emit('chat', msg);           //用其自身连接给自己发消息
        }
    });

    // 用户下线
    socket.on('disconnect', function () {
        MyLog(token_Map[token] + '下线了 下线时间：' + vf_utils.dateAdd("m", 2, new Date()));
        io.emit('user disconnected');
    });

});

//监听
http.listen(3000);

io.set("authorization", function (handshakeData, callback) {


    MyLog(handshakeData.url);
    // MyLog(handshakeData.headers);
    // MyLog(handshakeData._query);
    var token = handshakeData._query.auth_token;

    MyLog(token);
    MyLog(token_Map);

    if (isLogin > 0 || (token && token_Map.hasOwnProperty(token))) {    //说明存在
        callback(null, true);
        MyLog('放行连接');
    } else {
        if (!token) {                 //不存在token 拦截
            callback({data:'连接失败'}, false);
            MyLog('拦截连接了');
        } else {
            //查询是否存在
            vfUser.User.find({"auth_token": token}, function (err, result) {
                var user = result[0]; //user这个变量是一个User的实例。
                if (user) {
                    token_Map[token] = user.name;
                    callback(null, true);
                    MyLog('数据 查询 后放行的 --------放行连接');
                } else {
                    callback(null, false);  //不存在的token时需要 拦截
                    MyLog('数据 查询 后拦截 -------- 拦截连接了');
                }
            });
        }
    }
    // MyLog(handshakeData.rawHeaders);
    // MyLog(handshakeData.socket._peername);
    // MyLog(handshakeData.client._peername);

    // MyLog(new Date().toLocaleString());
    // MyLog();

    // if(isLogin<0){
    // 	callback(null, false);
    // }else{
    // callback(null, true);
    // }
});


