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
                        'name': name,
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
                res.send();
            }
        });
    });

    return router;
}