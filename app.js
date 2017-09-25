var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var path = require('path');
var validator = require('validator');

//express initilization.
var app = express();
app.use(bodyParser.json()); //may not need this line, as there is no json parsing.
app.use(bodyParser.urlencoded({ extended: true }));

//mysql initializaion.
//This code must not be inside this file, it should be inside an another file that
//does not added to git.
var con = mysql.createConnection({
    //Change this IP to localhost after development
    host: "192.168.0.101",
    user: "root",
    password: "fuckkmea",
    database: "voice"
});

con.connect(function (err) {
    if (err)
    {
        console.log(err);
        throw err;
    }
    console.log("Mysql Connection Successful");
});

app.post("/register", function (req, res) {
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
    }

    //The sql query for inserting data
    else
    {
        var data = { 'username': username, 'email': email, 'password': password, 'creationTime': new Date() };
        var sql = "INSERT INTO User SET ?";
        con.query(sql, data, function (err, result) {
            console.log(err);
            if (err) {
                //Error code for duplicate data.
                if (err.errno == 1062) {
                    res.status(403);
                    var response = {
                        'status': 'error',
                        'type': 'duplicate',
                    }
                    res.send(response);
                }
                //Error for null data
                if (err.errno == 1048) {
                    res.status(400);
                    var response = {
                        'status': 'error',
                        'type': 'nullData'
                    }
                    res.send(response);
                }
            }
            else {
                var response = {
                    'status': 'success'
                }
                res.send(response);
            }
        });
    }
});

//This code is temperory and should be replace by express static module.
//This is to serve a webpage.
app.get("/register", function (req, res) {
    res.sendFile(path.join(__dirname,"webview/register.html"));
});

//The server is listening at port 8000, not using 80 because it need sudo for running the script, which is a
//security risk. The port 80 is redirected to 8000 from the router.
app.listen(8000);

