var db = require('../config/mongoose.js');
var vfGroup = require('../entity/Group.js');

var GroupUser = db.model('GroupUser', {
    group_id: String,          //群 id
    user_id: String,         //群里的人 id
    user_name: String,
    creat_user: String,
    group_name: String,
});

// 加群
var create = function (group_id, user_name, group_name, callBack) {

    var groupUser = new GroupUser({
        group_id: group_id,
        group_name: group_name,
        user_id: "",
        user_name: user_name,
        creat_user: user_name,
    });

    //保存
    groupUser.save(function (err) {
        if (!err) {
            vfglobal.MyLog("加入群成功");
            if (callBack) callBack();
        }
    });
}

// 查询 加入过的所有群 以及群对应的 人
var findAll = function (user_name, callBack) {

    GroupUser.find({user_name: user_name}, function (err, data) {
        callBack(data);
    });

}


// 查询 是否已经加入过群
var findAndInsert = function (group_id, user_name, group_name, callBack) {

    GroupUser.findOne({group_id: group_id, user_name: user_name}, function (err, data) {

        if (data) { //说明 已经加入
            vfglobal.MyLog("群：" + data.group_name + "已经加入过了");
            callBack();
        } else {                        //没有加入 现在加入
            var groupUser = new GroupUser({
                group_id: group_id,
                user_name: user_name,
                group_name: group_name
            });
            //保存
            groupUser.save(function (err) {
                if (!err) {
                    vfglobal.MyLog("加入群" + group_name + "成功");
                    if (callBack) callBack();
                }
            });
        }
    });
}

// 离开群
var leave = function (group_id, user_name, group_name, callBack) {

    GroupUser.findOne({group_id: group_id, user_name: user_name}, function (err, data) {

        if (data) { //说明 已经加入
            vfglobal.MyLog(user_name + "离开群：" + group_name);
            data.remove();
            callBack();
        } else {
            vfglobal.MyLog(user_name + " 没加过这个群。。。");
        }

    });
}

module.exports = {
    GroupUser,
    create,
    findAndInsert,
    leave,
    findAll,
};