var router = function (app) {

    var vfUser = require('../entity/User.js');
    //用户注册 user register
    app.post("/register", function (req, res, next) {
        vfUser.register(res, req);
    });

    //文件上传
    var formidable = require('formidable');
    var fs = require('fs');
    var path = require("path");

    //上传文件
    app.post('/uploadFiles', function (req, res, next) {
        // vfglobal.MyLog('开始文件上传..');
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

            // vfglobal.MyLog(files.image.path);
            // vfglobal.MyLog('文件名:' + files.image.name);
            var t = (new Date()).getTime();
            //生成随机数
            var ran = parseInt(Math.random() * 8999 + 10000);
            //拿到扩展名
            var extname = ".jpg";
            try {
                extname = path.extname(files.image.name);
            } catch (e) {

            }
            //path.normalize('./path//upload/data/./file/./123.jpg'); 规范格式文件名
            var oldpath = path.normalize(files.image.path);

            //新的路径
            let newfilename = t + ran + extname;
            var newpath = './public/images/' + newfilename;
            // console.warn('oldpath:' + oldpath + ' newpath:' + newpath);
            var imageUrl = 'images/' + newfilename;
            fs.rename(oldpath, newpath, function (err) {
                if (err) {
                    console.error("改名失败" + err);
                }
                vfglobal.MyLog('上传文件成功..');
                res.json({
                    code: 1,
                    message: "上传文件成功",
                    data: imageUrl
                });
            });
        });
    });



    //手机端 登录  mobile login
    app.post("/mobileLogin", function (req, res) {
        vfUser.mobileLogin(res, req);
    });

    //获取系统中所有注册的用户 get all user
    app.get("/allUsers", function (req, res, next) {
        vfUser.findAllUser(res, req, vfglobal.allUser);
    });


    /*****-------------------------- 前端 start --------------------------***/
    //显示首页
    app.get("/", function (req, res, next) {
        res.render("index");
    });
    //前台登陆，检查此人是否有用户名，并且昵称不能重复
    app.get("/check", function (req, res, next) {
        var userName = req.query.yonghuming;
        if (!userName) {
            res.send("必须填写用户名");
            return;
        }
        if (vfglobal.allUser.indexOf(userName) != -1) {
            res.send("用户名已经被占用");
            return;
        }
        vfglobal.isLogin = 1;
        vfglobal.allUser.push(userName);
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

    // 视频聊天
    app.get("/videoChat", function (req, res) {

        console.log()
    });
}

module.exports = router;
