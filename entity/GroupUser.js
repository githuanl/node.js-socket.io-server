var db = require('../config/mongoose.js');

var GroupUser = db.model('GroupUser', {
    group_id: { type : mongoose.Schema.ObjectId,  ref: 'schoolClass'},     //群 id
    user_id: String,         //群里的人 id
    user_name: String,
});

var save = function (groupUser, callBack) {

    var groupUser = new Group({
        group_id: group.group_id,
        user_id: group.user_id,
        user_name: group.user_name,
    });

    //保存
    groupUser.save(function (err) {
        if (!err) {
            vfglobal.MyLog("关联保存成功");
            if (callBack) callBack();
        }
    });
}

module.exports = {
    Group,
    save,
};