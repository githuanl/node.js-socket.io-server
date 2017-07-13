var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

//socket.io公式：
var http = require('http').Server(app);
var io = require('socket.io')(http);
var vf_utils = require('./utils/utils.js');

var formidable = require('formidable');
var fs = require('fs');
var path = require("path");

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

//用户注册 user register
app.get("/register", function (req, res, next) {
    vfUser.register(res, req);
});

//上传文件
app.post('/uploadFiles', function (req, res, next) {
    console.log('开始文件上传....');
    var form = new formidable.IncomingForm();
    //设置编辑
    form.encoding = 'utf-8';
    //设置文件存储路径
    form.uploadDir = "./public/images/";
    //保留后缀
    form.keepExtensions = true;
    //设置单文件大小限制
    form.maxFieldsSize = 20 * 1024 * 1024;

    //form.maxFields = 1000;  设置所以文件的大小总和

    form.parse(req, function (err, fields, files) {

        console.log(files.image.path);
        console.log('文件名:' + files.image.name);
        var t = (new Date()).getTime();
        //生成随机数
        var ran = parseInt(Math.random() * 8999 + 10000);
        //拿到扩展名
        var extname = path.extname(files.image.name);

        //path.normalize('./path//upload/data/../file/./123.jpg'); 规范格式文件名
        var oldpath = path.normalize(files.image.path);

        //新的路径
        let newfilename = t + ran + extname;
        var newpath = './public/images/' + newfilename;


        console.warn('oldpath:' + oldpath + ' newpath:' + newpath);
        var imageUrl = 'images/' + newfilename;
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                console.error("改名失败" + err);
            }
            console.log('上传文件成功....');
            res.json({
                code: 1,
                message: "上传文件成功",
                data: imageUrl
            });
        });
    });
});


//手机端 登录  mobile login
app.get("/mobileLogin", function (req, res, next) {
    vfUser.mobileLogin(res, req, token_Map, function (user) {
        if (!alluser[user]) {
            alluser.push(user);
            io.emit("onLine", {'user': user});
        }
    });
    // vfUser.mobileLogin(res, req, token_Map);
});

//获取当前在线的所有的用户  Gets the current online user
app.get("/onLineUsers", function (req, res, next) {
    res.json({
        code: 0,
        message: "获取在线人员成功",
        data: alluser
    });
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
    var usrName = token_Map[token];
    // if (alluser.indexOf(usrName) == -1) {
    //     alluser.push(usrName);
    //     io.emit("onLine", {'user': usrName});
    // }
    socket_Map[usrName] = socket;  //将用户对应的 io 存起来

    // 整个系统 级的聊天
    socket.on("liaotian", function (msg) {
        MyLog(msg);
        //把接收到的msg原样广播
        socket.broadcast.emit("liaotian", msg);
    });

    // 单聊
    socket.on("chat", function (msg) {
        var to = msg.to + '';//给谁发消息
        // MyLog('--------------------------------------------->');
        // MyLog(msg);
        vfMessage.save(msg);   //将数据保存到数据库

        // io.emit('chat', msg);              // 所有人收的到
        if (socket_Map.hasOwnProperty(to)) {    //私聊
            MyLog('私聊发消息');
            var voIo = socket_Map[to];         //取出对应的io
            voIo.emit('chat', msg);           //用其自身连接给自己发消息
        }else{
            MyLog("对方已经下线了");
        }
    });

    // 用户下线
    socket.on('disconnect', function () {
        var usrName = token_Map[token];
        MyLog(alluser);
        MyLog(usrName + '下线了 下线时间：' + vf_utils.dateAdd("m", 2, new Date()));
        alluser.findIndex(function (T, number, arr) {
            if (T == usrName) {
                alluser.splice(number, 1);
                io.emit("offLine", {'user': usrName});
                return;
            }
        });
        MyLog(alluser);
        io.emit('userDisconnected', usrName);
    });

    // 连接超时
    socket.on('connect_timeout', function () {
        Mylog("连接超时");
    });

    // 重连开始
    socket.on('reconnect', function () {
        Mylog("重连开始");
    });

    // 重连失败
    socket.on('reconnect_failed', function () {
        Mylog("重连失败");
    });

    // 重连中
    socket.on('reconnecting', function () {
        Mylog("重连中");
    });

    // 连接失败
    socket.on('error', function () {
        for (var key in socket_Map) {
            var sockOld = socket_Map[key];
            if (sockOld == socket) {
                alluser.findIndex(function (T, number, arr) {
                    if (T == key) {
                        alluser.splice(number, 1);
                        io.emit("offLine", {'user': key});
                        return;
                    }
                });
            }
        }
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
            callback({data: '连接失败'}, false);
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


