var express = require('express');
var mysql = require('mysql');
var token = require('../tools/auth');

module.exports = function (con) {
    var router = express.Router();

    router.post('/create', function (req, res) {
        token.verify(req.query.auth, con, function (exist, userID) {
            if (exist) {
                var channel = req.body.channel;
                var title = req.body.title;
                var sql = mysql.format("SELECT ID FROM Channel WHERE name = ?", [channel]);
                con.query(sql, function (err, result) {
                    if (err)
                        throw err;
                    if (result.length != 0) {
                        var channelID = result[0].ID;
                        con.beginTransaction(function (err) {
                            if (err)
                                throw err;
                            var data = {
                                'userID': userID,
                                'channelID': channelID,
                                'creationTime': new Date()
                            };
                            sql = "INSERT INTO Post SET ?";
                            con.query(sql, data, function (err, result, field) {
                                if (err) {
                                    con.rollback(function () {
                                        throw err;
                                    });
                                }
                                //The post title is not checked for having empty string.
                                //It just assumes that title is not empty.
                                data = {
                                    'postID': result.insertId,
                                    'body': title
                                };
                                sql = "INSERT INTO PostTitle SET ?";
                                con.query(sql, data, function (err, result) {
                                    if (err) {
                                        con.rollback(function () {
                                            throw err;
                                        });
                                    }
                                    con.commit(function (err) {
                                        if (err) {
                                            con.rollback(function () {
                                                throw err;
                                            });
                                        }
                                        var response = {
                                            'status': 'success'
                                        }
                                        res.send(response);
                                    });
                                });
                            });
                        });
                    }
                    else
                    {
                        var response = {
                            'status': 'error',
                            'type': 'channelNotFound'
                        };
                        res.send(response);
                    }
                });
            }
            else
            {
                var response = {
                    'status': 'error',
                    'type': 'authError'
                };
                res.send(response);
            }
        });
    });

    return router;
}