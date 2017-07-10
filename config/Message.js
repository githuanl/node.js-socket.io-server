var db = require('./mongoose.js');
var vf_utils = require('../utils/utils.js');
var MyLog = require('./MyLog.js');
var Message = db.model('Message', {
    msg_id: String,            //消息id uuid
    timestamp: Number,        //发送(服务器)时间
    from: String,            //发送人
    to: String,             //要发送的人
    chat_type: String,      //聊天的类型 chat(单聊)    groupChat (群聊)
    groupId: String,        //群聊 房间id (群聊时房间id)
    ext: String,            //扩展
    bodies: String          //内容 json 文本 存储
                            //类型1-->文本类型  { "type":"txt","msg":"hello from test2"}
                            //类型2-->图片类型  { "type":"img","imgUrl":"hello from test2","imageName","图片名称"  //消息内容}
});

var save = function (message) {
    MyLog('保存');
    var msg_id = vf_utils.generateUUID();
    var timestamp = new Date().getTime();
    var msg = new Message({
        msg_id: msg_id,
        timestamp: timestamp,
        from: message.from,
        to: message.to,
        chat_type: message.chat_type,
        groupId: message.groupId,
        ext: message.ext,
        bodies: message.bodies,
    });
    MyLog('打印');
    MyLog(msg);
    //保存
    msg.save(function (err) {
    });
}

module.exports = {
    Message,
    save,
};