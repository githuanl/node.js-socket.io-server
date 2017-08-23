var mongoose = require('mongoose'); //引入mongoose模块
var db = mongoose.createConnection('mongodb://127.0.0.1:27017/chat',{useMongoClient:true});
db.on('error', function(error) {
	console.log('数据库连接失败：' + error);
});
db.on('open', function() {
	console.log('——数据库连接成功！——' + new Date().toLocaleString());
});

module.exports = db;