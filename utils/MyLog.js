var MyLog = function (msg,val2) {
	if(val2){
		console.log(msg,val2);
	}else{
		console.log(msg);
	}
}
module.exports = MyLog;