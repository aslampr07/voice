var express = require('express');
var token = require("../tools/auth")
var mysql = require('mysql');

module.exports = function (con) {
    var router = express.Router();


    router.post('/create', function (req, res) {
        token.verify(req.query.auth, con, function (exist, id) {
            if (exist) {
                if ('name' in req.body) {
                    var data = { 'name': req.body.name, 'creationTime': new Date() };
                    con.query("INSERT INTO Channel SET ?", data, function (err, result, field) {
                        if (err)
                            //Set the error management response.
                            console.log(err);
                        else {
                            if ('description' in req.body) {
                                var data = { 'body': req.body.description, 'channelID': result.insertId };
                                var sql = "INSERT INTO Description SET ?";
                                con.query(sql, data, function (err, results) {
                                    if (err)
                                        console.log(err);
                                    res.send("Channel Created with discription");
                                });
                            }
                            else
                                res.send("Channel Created without disctiption");
                        }
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