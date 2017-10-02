var express = require('express');
var token = require("../tools/auth")

module.exports = function (con) {
    var router = express.Router();


    router.post('/create', function (req, res) {
        token.verify(req.query.auth, con, function (exist, id) {
            if (exist)
            {
                res.send("The account does exist");
            }
            else
            {
                var response = {
                    'status': 'error',
                    'type': 'invalidAuth'
                };
                response.send(response);
            }
        });
    });


    return router;
}

//module.exports = router;