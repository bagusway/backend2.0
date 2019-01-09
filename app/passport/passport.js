var passport = require('passport');
var FacebookTokenStrategy = require('passport-facebook-token');
var GoogleTokenStrategy = require('passport-google-token').Strategy;
var User = require('../models/user');

module.exports = function() {

    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

    passport.use(new FacebookTokenStrategy({
            clientID: '261462964525976',
            clientSecret: '467bcb9d287043902ed94ff50dfa556c'
        },
        function(accessToken, refreshToken, profile, done) {
            User.upsertFbUser(accessToken, refreshToken, profile, function(err, user) {
                return done(err, user);
            });
        }
    ));

    passport.use(new GoogleTokenStrategy({
            clientID: '243828839009-c1meq0a7j7pp27age4i52kidj8o43s6m.apps.googleusercontent.com',
            clientSecret: 'Ax6BvqRcbgKXS3FGn1dvPya6',
            //passReqToCallback: true
        },
        function(accessToken, refreshToken, profile, done) {
            User.upsertGoogleUser(accessToken, refreshToken, profile, function(err, user) {

                return done(err, user);
            });
        }
    ));

    return passport;
};