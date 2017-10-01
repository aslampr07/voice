var express = require('express');
var router = express.Router();

router.get('/create', function (req, res) {
    res.send("your are on channel/require");
});

module.exports = router;