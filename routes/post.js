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
                var body = req.body.body;
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
                            //Creating post.
                            sql = "INSERT INTO Post SET ?";
                            con.query(sql, data, function (err, result, field) {
                                if (err) {
                                    con.rollback(function () {
                                        throw err;
                                    });
                                }
                                //The post title is not checked for having empty string.
                                //It just assumes that title is not empty.
                                //Adding the charID to the post.
                                var postID = result.insertId;
                                var charID = hashid.encode(postID);
                                sql = mysql.format("UPDATE Post SET charID = ? WHERE ID = ?", [charID, postID]);
                                con.query(sql, function (err) {
                                    if (err) {
                                        con.rollback(function () {
                                            throw err;
                                        });
                                    }
                                    data = {
                                        'postID': postID,
                                        'body': title
                                    };
                                    //Inserting the title of the post.
                                    sql = "INSERT INTO PostTitle SET ?";
                                    con.query(sql, data, function (err, result) {
                                        if (err) {
                                            con.rollback(function () {
                                                throw err;
                                            });
                                        }

                                        //Automatically upvoting the self post.

                                        sql = mysql.format("REPLACE INTO Vote(userID, postID, dir) VALUES(?, ?, ?)", [userID, postID, 1]);
                                        con.query(sql, function (err, result) {
                                            if (err)
                                                con.rollback(function () {
                                                    throw err;
                                                });
                                            //When there is body for the post
                                            if (body) {
                                                data = {
                                                    'body': body,
                                                    'postID': postID
                                                };
                                                //Inserting the body of the post.
                                                sql = "INSERT INTO PostText SET ?";
                                                con.query(sql, data, function (err, result) {
                                                    if (err) {
                                                        con.rollback(function () {
                                                            throw err;
                                                        });
                                                    }
                                                    con.commit(function () {
                                                        if (err) {
                                                            con.rollback(function () {
                                                                throw err;
                                                            })
                                                        }
                                                        var response = {
                                                            'status': 'success',
                                                            'id': charID
                                                        }
                                                        console.log("New Post created with body");
                                                        res.send(response);
                                                    });
                                                });
                                            }

                                            else {
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
                                                    console.log("New Post created without body");
                                                    res.send(response);
                                                });
                                            }
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
                    var sql = mysql.format("SELECT t.body AS title, p.charID AS ID, u.username, p.creationTime FROM Post p, " +
                        "PostTitle t, User u WHERE p.id = t.postID AND p.userID = u.ID AND p.channelId = ? ORDER BY p.creationTime DESC", [channelID]);
                    con.query(sql, function (err, result) {
                        if (err)
                            throw err;
                        for (var i = 0; i < result.length; i++) {
                            result[i].order = i;
                        }
                        var response = {};
                        response['status'] = 'success';
                        response['post'] = result;
                        res.send(response);
                    });
                }
                else {
                    var response = {
                        'status': 'error',
                        'type': 'noChannelFound'
                    };
                    res.send(response);
                }
            });
        }

        //If there is user query but no channel query
        else if (!req.query.channel && req.query.user) {
            var user = req.query.user;
            var sql = mysql.format("SELECT id FROM User WHERE username = ?", [req.query.user]);
            con.query(sql, function (err, result) {
                if (err)
                    throw err;
                if (result.length) {
                    var userID = result[0].id;
                    var sql = mysql.format("SELECT t.body AS title, p.charID as ID, c.name as Channel ,p.creationTime FROM "
                        + "Post p, PostTitle t, Channel c WHERE p.id = t.postID and p.channelID = c.ID AND p.userID = ? ORDER BY p.creationTime DESC", [userID]);
                    con.query(sql, function (err, result) {
                        if (err)
                            throw err;
                        for (var i = 0; i < result.length; i++) {
                            result[i].order = i;
                        }
                        res.send(result);
                    });
                }
                else {
                    var response = {
                        'status': 'error',
                        'type': 'noUserFound'
                    };
                    res.send(response);
                }
            })
        }
    });

    router.get('/read/:postID', function (req, res) {
        var charID = req.params.postID;
        var sql = mysql.format("SELECT ID, userID, channelID, creationTime FROM Post WHERE charID = ?", [charID]);
        con.query(sql, function (err, result) {
            if (err)
                throw err;
            if (result.length) {
                var response = {};
                var postId = result[0].ID;
                var userID = result[0].userID;
                var channelID = result[0].channelID;
                response['creationTime'] = result[0].creationTime;

                var sql = mysql.format("SELECT username FROM User where ID = ?", [userID]);
                con.query(sql, function (err, result) {
                    if (err)
                        throw err;
                    response['user'] = result[0].username;

                    var sql = mysql.format("SELECT name from Channel WHERE ID = ?", [channelID]);
                    con.query(sql, function (err, result) {
                        if (err)
                            throw err;
                        response['channel'] = result[0].name;

                        var sql = mysql.format("SELECT body FROM PostTitle WHERE postID = ?", [postId]);
                        con.query(sql, function (err, result) {
                            if (err)
                                throw err;
                            response['title'] = result[0].body;

                            var sql = mysql.format("SELECT body FROM PostText WHERE postID = ?", [postId]);
                            con.query(sql, function (err, result) {
                                if (err)
                                    throw err;
                                if (result.length) {
                                    response['body'] = result[0].body;
                                    response['status'] = 'success';
                                    res.send(response);
                                }
                                else {
                                    response['status'] = 'success';
                                    res.send(response);
                                }
                            });
                        });
                    });
                });
            }
            else {
                var response = {
                    'status': 'error',
                    'type': 'invalidPostID'
                }
                res.send(response);
            }
        });
    });

    //Used for voting.
    router.post('/vote', function (req, res) {
        token.verify(req.query.auth, con, function (exist, userID) {
            if (exist) {
                var postID = hashid.decode(req.body.postID)[0];
                var dir = parseInt(req.body.dir);

                var sql = mysql.format("REPLACE INTO Vote(userID, postID, dir) VALUES(?, ?, ?)", [userID, postID, dir]);
                con.query(sql, function (err, result) {
                    if (err)
                        throw err;
                    var response = {
                        'status': 'success'
                    }
                    res.send(response);
                })
            }

            else {
                var response = {
                    'status': 'error',
                    'type': 'authError'
                };
                res.send(response);
            }
        })
    });

    //To check if the user had voted on a post.
    router.get('/:postID/voted', function (req, res) {
        token.verify(req.query.auth, con, function (exist, userID) {
            if (exist) {
                var postID = hashid.decode(req.params.postID)[0];
                console.log(req.query);
                //Checking if Post exist.
                var sql = mysql.format("SELECT * FROM Post WHERE ID = ?", [postID]);
                con.query(sql, function (err, result) {
                    if (err)
                        throw err;
                    if (result.length) {
                        sql = mysql.format("SELECT dir FROM Vote WHERE userID = ? and postID = ?", [userID, postID]);
                        con.query(sql, function (err, result) {
                            var response = {};
                            if (err)
                                throw err;

                            //If the user already voted on the post.
                            if (result.length)
                                response = {
                                    'status': 'success',
                                    'dir': result[0].dir
                                };

                            //If the user has never voted on the post. I will return 0 as dir.    
                            else {
                                response = {
                                    'status': 'success',
                                    'dir': 0
                                };
                            }
                            res.send(response);
                        })
                    }
                    else {
                        var response = {
                            'status': 'error',
                            'type': 'postNotFound'
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

    return router;
}