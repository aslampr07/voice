var mysql = require('mysql');
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


module.exports = con;