var mysql = require('mysql');

module.exports = {
    'verify': function (auth, con, callback) {
        var sql = mysql.format("SELECT userID FROM Authentication WHERE token = ?", [auth]);
        con.query(sql, function (err, result, field) {
            if (err) { 
                throw err;
            }
            else 
            {
                if (result.length == 0)
                    callback(false, null);
                else
                    callback(true, result[0].userID);
            }
        });
    }
};