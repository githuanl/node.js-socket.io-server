var mongoose = require('mongoose'); //引入mongoose模块
var db = mongoose.connect('mongodb://127.0.0.1:27017/chat');
db.connection.on('error', function(error) {
	console.log('数据库连接失败：' + error);
});
db.connection.on('open', function() {
	console.log('——数据库连接成功！——');
});

module.exports = db;