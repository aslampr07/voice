var express = require('express');
//The mysql connection
var con = require('./config/db');
var bodyParser = require('body-parser');

//express initilization.
var app = express();
app.use(bodyParser.json()); //may not need this line, as there is no json parsing.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('webview'));

//For routing the channel requests.
//The mysql connection has been passed to the routes.
app.use('/account', require('./routes/account')(con));
app.use('/channel', require('./routes/channel')(con));
app.use('/profile', require('./routes/profile')(con));
app.use('/post', require('./routes/post')(con));

//The server is listening at port 8000, not using 80 because it need sudo for running the script, which is a
//security risk. The port 80 is redirected to 8000 from the router.
app.listen(8000);

