var express = require('express');
var mysql = require('mysql');
var validator = require('validator');
var crypto = require('crypto');


module.exports = function (con) {

    var router = express.Router();

    router.post("/register", function (req, res) {
        //get the properties from the request,
        //validation of the req.body is not done, currently it is assumed that the request properties is valid
        var username = req.body.username;
        var email = req.body.email;
        var password = req.body.password;

        if (!validator.isEmail(email)) {
            var response = {
                'status': 'error',
                'type': 'invalidEmail'
            }
            res.send(response);
            console.log("Invalid Email ID on account creation.");
        }

        //The sql query for inserting data
        else {
            //The password is not salted yet, it should be done ASAP
            var data = { 'username': username, 'email': email, 'password': password, 'creationTime': new Date() };
            var sql = "INSERT INTO User SET ?";
            con.query(sql, data, function (err, result) {
                if (err) {
                    //Error code for duplicate data.
                    if (err.errno == 1062) {
                        res.status(403);
                        var response = {
                            'status': 'error',
                            'type': 'duplicate',
                        }
                        res.send(response);
                        console.log("Duplicate username or email on account creation.");
                    }
                    //Error for null data
                    if (err.errno == 1048) {
                        res.status(400);
                        var response = {
                            'status': 'error',
                            'type': 'nullData'
                        }
                        res.send(response);
                        console.log("Empty field on account creation");
                    }
                }
                else {
                    var response = {
                        'status': 'success'
                    }
                    res.send(response);
                    console.log("Account is created");
                }
            });
        }
    });

    router.post("/login", function (req, res) {
        //I don't know if it is good idea to send the password over the post request,
        //might need to change it.
        var login = req.body.login;
        var password = req.body.password;
        var sql = mysql.format("SELECT password, ID from User where username = ? or email = ?", [login, login]);
        con.query(sql, function (err, result, field) {
            if (result.length == 0) {
                var response = {
                    'status': 'error',
                    'type': 'notExist'
                };
                res.send(response);
                console.log("Login does not exist");
            }
            else {
                //This single lines compare the password, The gateway to everything.
                if (result[0].password == password) {
                    var token = crypto.randomBytes(20).toString('HEX');
                    var data = { 'userID': result[0].ID, 'token': token, 'creationTime': new Date() };
                    var sql = "INSERT INTO Authentication SET ?";
                    con.query(sql, data, function (err, result) {
                        if (err) {
                            res.send("Error in the database")
                            throw err;
                        }

                        //When is everything is fine.
                        else {
                            var response = {
                                'status': 'success',
                                'token': token
                            };
                            res.send(response);
                            console.log("Login Successful");
                        }
                    })
                }
                else {
                    var response = {
                        'status': 'error',
                        'type': 'wrongPassword'
                    };
                    res.send(response);
                    console.log("Wrong password on login");
                }
            }

        });
    });
    return router;
}