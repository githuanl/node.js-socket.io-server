//返回json的数据结构
var sendJson = function(res, status, message, data) {
	var result = data || new Array();
	res.json({
		status: status,
		message: message,
		data: result
	});
}

/*
 *   功能:实现VBScript的DateAdd功能.
 *   参数:interval,字符串表达式，表示要添加的时间间隔.
 *   参数:number,数值表达式，表示要添加的时间间隔的个数.
 *   参数:date,时间对象.
 *   返回:新的时间对象.
 *   var now = new Date();
 *   var newDate = DateAdd( "d", 5, now);
 *---------------   DateAdd(interval,number,date)   -----------------
 */
var dateAdd = function (interval, number, date) {
    switch (interval) {
        case "y": {
            date.setFullYear(date.getFullYear() + number);
            return date;
            break;
        }
        case "q": {
            date.setMonth(date.getMonth() + number * 3);
            return date;
            break;
        }
        case "m": {
            date.setMonth(date.getMonth() + number);
            return date;
            break;
        }
        case "w": {
            date.setDate(date.getDate() + number * 7);
            return date;
            break;
        }
        case "d": {
            date.setDate(date.getDate() + number);
            return date;
            break;
        }
        case "h": {
            date.setHours(date.getHours() + number);
            return date;
            break;
        }
        case "m": {
            date.setMinutes(date.getMinutes() + number);
            return date;
            break;
        }
        case "s": {
            date.setSeconds(date.getSeconds() + number);
            return date;
            break;
        }
        default: {
            date.setDate(d.getDate() + number);
            return date;
            break;
        }
    }
}

/**
 * [generateUUID 生成全球唯一标识UUID]
 * @return {[type]} [uuid字符串]
 */
var generateUUID = function() {
	var d = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (d + Math.random() * 16) % 16 | 0;
		d = Math.floor(d / 16);
		return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
	});
	return uuid;
};

/**
 * [parseURI 解析URL，可获得相关参数]
 * @description [url中拼接的参数在params中]
 * @param  {[string]} url [需要解析的url，node中必选]
 * @return {[object]} [对象返回url中的相关参数信息]
 */
var parseURI = function(url) {
	var query = {};
	var urlArr = url.split('?');
	if (urlArr.length > 1) {
		var queryArr = urlArr[1].split('&');
		for (var i = 0; i < queryArr.length; i++) {
			var someKeyValue = queryArr[i].split('=');
			query[someKeyValue[0]] = someKeyValue[1];
		}
	}
	return query;
}

/*
 * [creatRandomNum 生成随机数，依据时间戳]
 * @description [依据时间戳,加上随机数作为房间ID,避免重复]
 * @return {[string]} [返回生成的随机数]
 */
var creatRandomNum = function() {
	return new Date().getTime() + "" + Math.floor(Math.random() * 899 + 100);
}

module.exports = {
    dateAdd,
	sendJson,
	generateUUID,
	parseURI,
	creatRandomNum
}