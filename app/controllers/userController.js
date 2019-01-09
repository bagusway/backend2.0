var User = require('../models/user');
var jwt = require('jsonwebtoken');
var { secret } = require('../config/index');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var hbs = require('nodemailer-express-handlebars');

//Cek ROLE

/*
1 = user
2 = provider
3 = admin provider
4 = admin travinesia
5 = customer
*/

var options = {
    auth: {
        api_user: 'travinesia',
        api_key: 'travinesia123'
    }
}

var client = nodemailer.createTransport(sgTransport(options));

client.use('compile', hbs({
    viewPath: './views/email/',
    extName: '.hbs'
}));
//User Registeration Route
var register = function(req, res) {
    var user = new User();
    user.name = req.body.name;
    user.telephone = req.body.telephone;
    user.email = req.body.email;
    user.password = req.body.password;
    user.flag_register = 1;
    user.temporarytoken = jwt.sign({ login_type: 0, id: user._id, id_user: user.id_user, name: user.name, email: user.email, role: user.role }, secret, { expiresIn: '24h' });
    if (req.body.name == null || req.body.name == '' || req.body.email == null || req.body.email == '' || req.body.password == null || req.body.password == '') {
        res.json({ status: 406, success: false, message: 'All Forms must be filled in!' });
    } else {
        user.save(function(err) {
            if (err) {
                if (err.errors != null) {
                    if (err.errors.name) {
                        res.json({ success: false, message: err.errors.name.message });
                    } else if (err.errors.email) {
                        res.json({ status: 401, success: false, message: err.errors.email.message });
                    } else if (err.errors.password) {
                        res.json({ success: false, message: err.errors.password.message });
                    } else {
                        res.json({ success: false, message: err });
                    }
                } else if (err) {
                    if (err.code == 11000) {
                        res.json({ status: 406, success: false, message: 'That email is already taken' });
                    } else {
                        res.json({ success: false, message: err });
                    }
                }
            } else {
                var activation = "http://travinesia.com:3000/v1/user/activate/" + user.temporarytoken;
                var email = {
                    from: 'Travinesia, travinesia@localhost.com',
                    to: user.email,
                    subject: 'Travinesia Activation Link',
                    //user.name, http://travinesia.com:3000/v1/user/activate/user.temporarytoken, 
                    template: 'verifikasi_akun_compiled',
                    context: {
                        name: user.name,
                        activation: activation,
                        temporarytoken: user.temporarytoken,
                        img: "https://img.travinesia.com/logo/travinesia.png"
                    }
                };

                client.sendMail(email, function(err, info) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Message sent: ' + info.response);
                    }
                });
                res.json({ status: 200, success: true, message: 'Account registered! Please check your e-mail for activation link.' });
            }
        });
    }
}


//checkemail
var checkemail = function(req, res) {
    User.findOne({ email: req.body.email }).select('email').exec(function(err, user) {
        if (err) throw err;

        if (user) {
            res.json({ success: false, message: 'That E-mail is already taken' });
        } else {
            res.json({ success: true, message: 'Valid e-mail' });
        }
    });
}

//User Login Route
var authenticate = function(req, res) {
    User.findOne({ email: req.body.email }).select('name email photo telephone password id_user role active flag_blocked').exec(function(err, user) {
        if (err) throw err;

        if (!user) {
            res.json({ status: 400, success: false, message: 'Ensure your Email and Password are correct' });
        } else if (user.active == true && user.flag_blocked == false) {
            if (req.body.password) {
                var validPassword = user.comparePassword(req.body.password);
            } else {
                res.json({ status: 400, success: false, message: 'No password provided' });
            }
            if (!validPassword) {
                res.json({ status: 400, success: false, message: 'Ensure your Email and Password are correct' });
            } else {
                //Login Expire 24hours
                if (req.body.login_type == 0) {
                    var token = jwt.sign({ login_type: 0, id: user._id, id_user: user.id_user, name: user.name, email: user.email, role: user.role }, secret, { expiresIn: '24h' });
                    res.json({ status: 200, success: true, message: 'User authenticated!', token: token, name: user.name, email: user.email, photo: user.photo, telephone: user.telephone, role: user.role });
                } else if (req.body.login_type == 1) { //login Zero Expire
                    var token = jwt.sign({ login_type: 1, id: user._id, id_user: user.id_user, name: user.name, email: user.email, role: user.role }, secret);
                    res.json({ status: 200, success: true, message: 'User authenticated!', token: token, name: user.name, email: user.email, photo: user.photo, telephone: user.telephone, role: user.role });
                }
            }
        } else if (user.active == false) {
            res.json({ status: 403, success: false, message: 'Please Active Your Account firts' });
        } else if (user.flag_blocked == true) {
            res.json({ status: 403, success: false, message: 'Your Account Blocked!' });
        }
    });
}

var authenticateAdmin = function(req, res) {
    User.findOne({ email: req.body.email }).select('name email password id_user role').exec(function(err, user) {
        if (err) throw err;
        if (!user) {
            res.json({ success: false, message: 'Ensure your Email and Password are correct' });
        } else if (user.role == 3) {
            if (req.body.password) {
                var validPassword = user.comparePassword(req.body.password);
            } else {
                res.json({ status: 400, success: false, message: 'No password provided' });
            }
            if (!validPassword) {
                res.json({ status: 400, success: false, message: 'Ensure your Email and Password are correct' });
            } else {
                var token = jwt.sign({ login_type: 0, id: user._id, id_user: user.id_user, name: user.name, email: user.email, role: user.role }, secret, { expiresIn: '24h' });
                res.json({ status: 200, success: true, message: 'Admin authenticated!', token: token });
            }
        }
    });
}


//Route Activation Account
//Must be set in Angular route return $http.put('/activate.) because backend cannot declare it in HTML
var activateAccount = function(req, res) {
    User.findOne({ temporarytoken: req.params.token }, function(err, user) {
        if (err) throw err;
        var token = req.params.token;
        jwt.verify(token, secret, function(err, decoded) {
            if (err) {
                res.json({ status: 400, success: false, message: 'Activation link has expired.' });
            } else if (!user) {
                res.json({ status: 400, success: false, message: 'Activation link has expired.' });
            } else {
                user.temporarytoken = false;
                user.active = true;
                user.save(function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        var email = {
                            from: 'Travinesia, travinesia@localhost.com',
                            to: user.email,
                            subject: 'Travinesia Activation Link',
                            //user.name, http://travinesia.com:3000/v1/user/activate/user.temporarytoken, 
                            template: 'verifikasi_berhasil_compiled',
                            context: {
                                name: user.name,
                                temporarytoken: user.temporarytoken,
                                img: "https://img.travinesia.com/logo/travinesia.png"
                            }
                        };

                        client.sendMail(email, function(err, info) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('Message sent: ' + info.response);
                            }
                        });
                        res.json({ status: 200, success: true, message: 'Account activated!' });
                    }
                });
            }
        });
    });
}


//Route Forgot Password
//Go to page Input New Password /v1/user/reset/:token
var forgotPassword = function(req, res) {
    User.findOne({ email: req.body.email }).select('email resettoken name').exec(function(err, user) {
        if (err) throw err;
        if (!user) {
            res.json({ status: 404, success: false, message: 'E-mail was not found' });
        } else if (user.flag_register != 1) {
            res.json({ status: 400, success: false, message: 'User Register on Facebook or Google' });
        } else {
            user.resettoken = jwt.sign({ login_type: 0, id: user._id, id_user: user.id_user, name: user.name, email: user.email, role: user.role }, secret, { expiresIn: '24h' });
            user.save(function(err) {
                if (err) {
                    res.json({ success: false, message: err });
                } else {
                    var email = {
                        from: 'Travinesia, travinesia@localhost.com',
                        to: user.email,
                        subject: 'Travinesia Reset Password Request',
                        //user.name, http://travinesia.com:3000/v1/user/forgot_password/user.resettoken
                        template: 'ubah_password_compiled',
                        context: {
                            name: user.name,
                            resettoken: user.resettoken,
                            img: "https://img.travinesia.com/logo/travinesia.png"
                        }

                    };

                    client.sendMail(email, function(err, info) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Message sent: ' + info.response);
                        }
                    });
                    res.json({ status: 200, success: true, message: 'Please check your e-mail for password reset link' });
                }
            });
        }
    });
}


//Go to page Input New Password /v1/user/resetpassword/:token
var getPassword = function(req, res) {
    User.findOne({ resettoken: req.params.token }).select().exec(function(err, user) {
        if (err) throw err;
        var token = req.params.token;

        //verify token
        jwt.verify(token, secret, function(err, decoded) {
            if (err) {
                res.json({ status: 400, success: false, message: 'Password link has expired' });
            } else {
                if (!user) {
                    res.json({ status: 400, success: false, message: 'Password link has expired' });
                } else {
                    res.json({ status: 200, success: true, message: user.email, token: user.resettoken });
                }
            }
        });
    });
}

//Save new password
var savePassword = function(req, res) {
    User.findOne({ email: req.body.email }).select('name email password resettoken').exec(function(err, user) {
        if (err) throw err;
        if (req.body.password == null || req.body.password == '') {
            res.json({ status: 400, success: true, message: 'Password not provided' });
        } else {
            if (user.resettoken === req.body.token) {
                user.password = req.body.password;
                user.resettoken = false;
                user.save(function(err) {
                    if (err) {
                        res.json({ status: 400, success: false, message: err });
                    } else {
                        var email = {
                            from: 'Travinesia, travinesia@localhost.com',
                            to: user.email,
                            subject: 'Travinesia Password has ben reset',
                            text: 'Hello ' + user.name + ', This e-mail is to notify you that your password was recently reset at travinesia.com',
                            html: 'Hello<strong> ' + user.name + '</strong>,<br><br>This e-mail is to notify you that your password was recently reset at travinesia.com'
                        };

                        client.sendMail(email, function(err, info) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('Message sent: ' + info.response);
                            }
                        });
                        res.json({ status: 200, success: true, message: 'Password has been reset!' });
                    }


                });
            } else {
                res.json({ status: 400, success: false, message: 'Cannot Save Password' });
            }
        }
    });
}

// router.post('/auth', function(req, res){
//     res.send(req.decoded);
// });
module.exports = {
    register: register,
    checkEmail: checkemail,
    authenticate: authenticate,
    activate: activateAccount,
    forgot: forgotPassword,
    getForgotPassword: getPassword,
    save: savePassword,
    authenticateAdmin: authenticateAdmin
}