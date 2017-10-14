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

    router.get('/_:channelName', function (req, res) {
        //For getting the name, creationTime and description of the channel
        var sql = mysql.format("SELECT c.name, d.body, creationTime FROM Channel c, Description d" +
            " WHERE c.ID = d.channelID AND c.name = ?", [req.params.channelName]);
        con.query(sql, function (err, result) {
            if (err)
                throw err;
            //If the channel is not found
            if (result.length == 0)
            {
                var response = {
                    'status': 'error',
                    'type': 'noChannelFound'
                };
                res.send(response);
            }
            //If Channel is found
            else
            {
                var response = {
                    'status': 'success',
                    'name': result[0].name,
                    'creationTime': result[0].creationTime,
                    'description': result[0].body
                }
                //For finding the name of the admins of the channel.
                sql = mysql.format("SELECT u.username FROM User u, Channel c, Administration a WHERE " +
                    "a.channelID = c.ID and a.userID = u.ID and c.name = ?", [req.params.channelName]);
                console.log(sql);
                con.query(sql, function (err, result) {
                    if (err)
                        throw err;
                    var admins = [];
                    for (item of result)
                    {
                        admins.push(item.username);
                    }
                    response['admins'] = admins;
                    res.send(response);
                });

            }
        });
    });

    return router;
}