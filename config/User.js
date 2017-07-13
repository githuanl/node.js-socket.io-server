var db = require('./mongoose.js');
var vf_utils = require('../utils/utils.js');

var User = db.model('User', {
    name: String,
    password: String,
    auth_token: String,
    auth_date: Number
});

// 保存
var save = function (userName, password, callBack) {
    //生成token
    var mtoken = vf_utils.generateUUID();

    //生成token
    var auth_date = vf_utils.dateAdd("m", 2, new Date()).getTime();
    //实例化，实例化的时候，new User
    var userN = new User({name: userName, password: password, auth_token: mtoken, auth_date: auth_date});
    //保存
    userN.save(function (err) {
        if (!err) {
            if (callBack) {
                callBack(mtoken, auth_date);
            }
            console.log("注册 -- 保存成功!");
        } else {
            console.log("注册 -- 保存失败!");
        }
    });
}

// 注册
var register = function (res, req) {
    var userName = req.query.userName;
    if (!userName) {
        res.json({
            code: -1,
            message: "用户名不能为空",
            data: ""
        });
        return;
    }

    var password = req.query.password;
    if (!password) {
        res.json({
            code: -1,
            message: "密码不能为空",
            data: ""
        });
        return;
    }

    //查询是否已经注册
    User.find({"name": userName}, function (err, result) {
        var user = result[0]; //user这个变量是一个User的实例。
        if (!user) {		//如果不存在 则注册
            var mtoken = '';
            var auth_date = '';
            save(userName, password, function (token, date) {
                mtoken = token;
                auth_date = date;
            });
            res.json({
                code: 0,
                message: "注册成功",
                data: {
                    auth_token: mtoken,
                    auth_date: auth_date
                }
            });
        } else {			//如果存在则提示已经存在用户
            res.json({
                code: -1,
                message: "用户已存在",
                data: ""
            });
        }
        console.log(user);
    });
}


var mobileLogin = function (res, req, token_Map, callBack) {
    console.log('login');
    var userName = req.query.userName;
    console.log(userName);
    if (!userName) {
        res.json({
            code: -1,
            message: "用户名不能为空",
            data: ""
        });
        return;
    }

    var password = req.query.password;
    if (!password) {
        res.json({
            code: -1,
            message: "密码不能为空",
            data: ""
        });
        return;
    }

    //查询数据
    User.find({"name": userName, "password": password}, function (err, result) {
        var user = result[0]; //user这个变量是一个User的实例。
        // user.password = 8;
        // user.save();
        if (user) {
            token_Map[user.auth_token] = userName;
            if (callBack) {
                callBack(userName);
            }
            res.json({
                code: 0,
                message: "登录成功",
                data: {
                    auth_token: user.auth_token,
                    auth_date: user.auth_date
                }
            });
        } else {
            res.json({
                code: -1,
                message: "用户名或密码错误",
                data: ""
            });
        }
        console.log(user);
    });
}

//根据用户名查询 user
var findUserWithName = function (res, req) {

}

module.exports = {
    User,
    mobileLogin,
    save,
    findUserWithName,
    register,
};