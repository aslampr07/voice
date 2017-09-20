var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');

//express initilization.
var app = express();
app.use(bodyParser.json()); //may not need this line, as there is no json parsing.
app.use(bodyParser.urlencoded({ extended: true }));

//mysql initializaion.
var con = mysql.createConnection({
    host: "192.168.0.101",
    user: "root",
    password: "fuckkmea",
    database: "voice"
});

con.connect(function (err) {
    if (err)
        throw err;
    console.log("Database Connected");
});

app.post("/register", function (req, res) {
    //get the crudential from the request
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;

    var data = { 'username': username, 'email': email, 'password': password };
    var sql = "INSERT INTO User SET ?";
    con.query(sql, data, function (err, result) {
        if (err)
            throw err;
        console.log(result);
        res.send("Data Succesfully added query the User table in database");
    });
});

app.listen(8000);