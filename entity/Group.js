var db = require('../config/mongoose.js');

var Group = db.model('Group', {
    group_id: String,        //群聊 房间id (群聊时房间id)
    group_name: String,      //群聊 房间名称 (群聊时房间name)
    user_id: String,         //群里的人
    creat_id: String,        //创建的人 id
    creat_name: String,      //创建的人 name
    creat_date: String,      //创建时间
});

var save = function (userName, group_name, callBack) {

    var group_id = vfglobal.util.generateUUID();

    var group = new Group({
        group_id: group_id,
        group_name: group_name,
        user_id: "",        //字段保留
        creat_date: new Date().getTime(),
        creat_name: userName,
    });

    Group.findOne({group_name: group_name, creat_name: userName}, function (err, data) {
        if (data) { //说明 群已经存在

        } else {
            //保存
            group.save(function (err) {
                if (err) {
                    callBack("err");
                } else {
                    vfglobal.MyLog("群：" + group_name + "创建成功");
                    if (callBack) callBack();
                }
            });
        }
    });
}

module.exports = {
    Group,
    save,
};