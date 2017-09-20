var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');

var app = express();
app.use(bodyParser.json()); //may not need this line, as there is no json parsing.
app.use(bodyParser.urlencoded({ extended: true }));


app.post("/register", function (req, res) {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
});

app.listen(8000);