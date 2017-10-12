"use strict";
var express = require('express');
var mysql = require('mysql');
var token = require('../tools/auth');

module.exports = function (con) {
    var router = express.Router();

    router.get('/', function (req, res) {
        token.verify(req.query.auth, con, function (exist, id) {
            if (exist) {
                console.log(id);
                var sql = mysql.format('SELECT username, creationTime FROM User WHERE id = ?', [id]);
                con.query(sql, function (err, result) {
                    if (err)
                        throw err;
                    var name = result[0].username;
                    var creationTime = result[0].creationTime;
                    console.log(creationTime);
                    var response = {
                        'status': 'success',
                        'username': name,
                        'creationTime': creationTime
                    };
                    res.send(response);
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
    router.get('/:username', function (req, res) {
        var sql = mysql.format('SELECT username, creationTime FROM User WHERE username = ?', [req.params.username]);
        con.query(sql, function (err, result) {
            if (err)
                throw err;
            if (result.lenght == 0) {
                var response = {
                    'status': 'error',
                    'type': 'noUserFound'
                }
                res.send(response);
            }
            else {
                var response = {
                    'status': 'success',
                    'username': result[0].username,
                    'creationTime': result[0].creationTime
                };
                res.send(response);
            }
        });
    });


    return router;
}