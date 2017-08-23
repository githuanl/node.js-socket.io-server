var express = require('express');
var app = express();
var os = require('os');
var http = require('http');

var GetRequest = function (url, callBack) {

    http.get(url, function (res) {

        callBack(null, res);
    }).on('error', function (e) {

        callBack(e, null);
    });
}

var PostRequst = function (url, body, callBack) {

    callBack('PostSuccess');
}

module.exports = {
    GetRequest,
    PostRequst
};