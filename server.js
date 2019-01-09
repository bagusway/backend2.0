var express = require('express');
var app = express();
//var http = require('http');
var https = require('https');
var port = process.env.PORT || 1210;
//var server = require('http').createServer(app);
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var router = express.Router();
var routerAccess = express.Router();
var passport = require('passport');
var social = require('./app/passport/passport')(app, passport);
var fs = require('fs');
var jwt = require('jsonwebtoken');
var { secret } = require('./app/config/index');
var path = require('path');

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
var userRouter = require('./app/routes/user');
var userAccessRouter = require('./app/routes/userAccess');
var providerRouter = require('./app/routes/provider');
var attributeRouter = require('./app/routes/get');
var otomatisasiRouter = require('./app/routes/otomatisasi');
var paymentRouter = require('./app/routes/payment');
var discussionRouter = require('./app/routes/discussion');
var bookingRouter = require('./app/routes/booking');
var adminRouter = require('./app/routes/admin');
var chatRouter = require('./app/routes/chat');

//view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var privateKey = fs.readFileSync('./app/keys/privkey.pem', 'utf8');
var certificate = fs.readFileSync('./app//keys/cert.pem', 'utf8');
var ca = fs.readFileSync('./app/keys/chain.pem', 'utf8');

var credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, content-type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    // bypass option method
    if ('OPTIONS' == req.method) {
        res.send(200);
    } else {
        next();
    }
});

app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(passport.initialize());
app.use(passport.session());
//app.use(express.multipart());

app.use('/v1/user', userRouter);
app.use('/get', attributeRouter);
app.use('/otomatisasi', otomatisasiRouter);

var httpsServer = https.createServer(credentials, app);
var io = require('socket.io').listen(httpsServer);
//chat connection
io.on('connection', function(socket) {
    console.log('User connected');
    socket.on('disconnect', function() {
        console.log('User disconnected');
    });
    socket.on('save-message', function(data) {
        console.log(data);
        io.emit('new-message', { message: data });
    });
});


// --- JWT Validaltion ---
app.use(function(req, res, next) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        var token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, secret, function(err, decoded) {
            if (err) {
                return res.json({ status: 401, success: false, message: 'Failed to authenticate token.' });
            } else {
                //Expire 24h
                if (decoded.login_type == 0) {
                    req.user_id = decoded.id;
                    req.id_user = decoded.id_user;
                    req.role = decoded.role;
                    req.token = jwt.sign({
                        id: decoded.id,
                        id_user: decoded.id_user,
                        name: decoded.name,
                        email: decoded.email,
                        role: decoded.role
                    }, secret, { expiresIn: '24h' });
                    next();
                    //0 Expire
                } else if (decoded.login_type == 1) {
                    req.user_id = decoded.id;
                    req.id_user = decoded.id_user;
                    req.role = decoded.role;
                    req.token = jwt.sign({
                        id: decoded.id,
                        id_user: decoded.id_user,
                        name: decoded.name,
                        email: decoded.email,
                        role: decoded.role
                    }, secret);
                    next();
                }

            }
        })
    } else {
        return res.status(400).json({ status: 400, success: false, message: 'Please send token' });
    }
});


httpsServer.listen(port, function() {
    console.log('HTTPS Server running on ' + port);
});

app.use('/v1/user', userAccessRouter);
app.use('/v1/provider', providerRouter);
app.use('/v1/discussion', discussionRouter);
app.use('/v1/user/booking', bookingRouter);
app.use('/v1/user/payment', paymentRouter);
app.use('/v1/admin', adminRouter);
app.use('/v1/chat', chatRouter);

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/backendtravinesia', function(err) {
    if (err) {
        console.log('Not connected to the database: ' + err);
    } else {
        console.log('Successfully connected to MongoDB');
    }
});