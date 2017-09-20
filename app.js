var express = require('express');

var app = express();
app.get("/", function (req, res) {
    res.send("Hai How are you");
});

app.listen(8000);