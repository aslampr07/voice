var express = require('express');
//The mysql connection
var con = require('./config/db');
var bodyParser = require('body-parser');

//express initilization.
var app = express();
app.use(bodyParser.json()); //may not need this line, as there is no json parsing.
app.use(bodyParser.urlencoded({ extended: true }));

//Using the static method for serving the static.
//Below are static pages, on different urls
app.use('/', express.static('public'));
app.use('/login', express.static('public/pages/login'));
app.use('/register', express.static('public/pages/register'));
app.use('/post/create', express.static('public/pages/post/create'));
app.use('/post/read/:postID', express.static('public/pages/post/read'));
app.use('/channel/create', express.static('public/pages/channel/create'))
app.use('/channel/_:channelName', express.static('public/pages/channel/view'));

//For routing the channel requests.
//The mysql connection has been passed to the routes.
app.use('/api/1.0/account', require('./routes/account')(con));
app.use('/api/1.0/channel', require('./routes/channel')(con));
app.use('/api/1.0/profile', require('./routes/profile')(con));
app.use('/api/1.0/post', require('./routes/post')(con));

//The server is listening at port 8000, not using 80 because it need sudo for running the script, which is a
//security risk. The port 80 is redirected to 8000 from the router.
app.listen(8000);