var express = require('express');
var mysql = require('mysql');
var token = require('../tools/auth');
var Hashid = require('hashids');

module.exports = function (con) {
    var router = express.Router();
    var hashid = new Hashid('Olakkeda mood', 10);

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
                                var charID = hashid.encode(result.insertId);
                                sql = mysql.format("UPDATE Post SET charID = ? WHERE ID = ?", [charID, result.insertId]);
                                con.query(sql, function (err) {
                                    if (err) {
                                        con.rollback(function () {
                                            throw err;
                                        });
                                    }
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
                                                'status': 'success',
                                                'id': charID
                                            }
                                            console.log("New Post created");
                                            res.send(response);
                                        });
                                    });

                                });
                            });
                        });
                    }
                    else {
                        var response = {
                            'status': 'error',
                            'type': 'channelNotFound'
                        };
                        res.send(response);
                    }
                });
            }

            else {
                var response = {
                    'status': 'error',
                    'type': 'authError'
                };
                res.send(response);
            }
        });
    });

    router.get('/get', function (req, res) {
        if (!req.query.channel && !req.query.user)
            res.send("No query string found");


        //If there is channel query but no user query in the request.
        else if (req.query.channel && !req.query.user) {
            var channel = req.query.channel;
            var sql = mysql.format("SELECT id FROM Channel WHERE name = ?", [channel]);
            con.query(sql, function (err, result) {
                if (err)
                    throw err;
                if (result.length) {
                    var channelID = result[0].id;
                    var sql = mysql.format("SELECT t.body AS title, p.charID AS ID, u.username, p.creationTime FROM Post p, PostTitle t, User u WHERE p.id = t.postID AND p.userID = u.ID AND p.channelId = ?", [channelID]);
                    con.query(sql, function (err, result) {
                        for (var i = 0; i < result.length; i++) {
                            result[i].order = i;
                        }
                        res.send(result);
                    });
                }
                else
                    res.send("Channel Not found");
            });
        }
    });

    return router;
}