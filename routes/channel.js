var express = require('express');
var token = require("../tools/auth")
var mysql = require('mysql');

module.exports = function (con) {
    var router = express.Router();


    router.post('/create', function (req, res) {
        token.verify(req.query.auth, con, function (exist, id) {
            if (exist) {
                if ('name' in req.body) {
                    con.beginTransaction(function (err) {
                        if (err) {
                            throw err;
                        }
                        var data = { 'name': req.body.name, 'creationTime': new Date() };
                        con.query("INSERT INTO Channel SET ?", data, function (err, result, field) {
                            if (err) {
                                con.rollback(function () {
                                    throw err;
                                });
                            }
                            else {
                                var channelID = result.insertId;
                                var data = { 'userID': id, 'channelID': channelID };
                                con.query("INSERT INTO Administration SET ?", data, function (err, result, field) {
                                    if (err) {
                                        con.rollback(function () {
                                            throw err;
                                        });
                                    }
                                    con.commit(function (err) {
                                        if (err)
                                            throw err;
                                        else {
                                            console.log("Channel Created");
                                            if ('description' in req.body) {
                                                var data = { 'body': req.body.description, 'channelID': channelID };
                                                con.query("INSERT INTO Description SET ?", data, function (err, results) {
                                                    if (err)
                                                        throw err;
                                                    var response = {
                                                        'status': 'success',
                                                    }
                                                    res.send(response);
                                                });
                                            }
                                        }
                                    });
                                });
                            }
                        });
                    });
                }
            }
            else {
                res.status(401);
                var response = {
                    'status': 'error',
                    'type': 'invalidAuth'
                };
                res.send(response);
            }
        });
    });
    return router;
}