var User = require('../models/user');
var Provider = require('../models/provider');
var jwt = require('jsonwebtoken');
var { secret } = require('../config/index');
var ImageSaver  =   require('image-saver-nodejs/lib');
var multer = require('multer');
var Booking =require('../models/booking');


    var getProfile = function(req, res){
        User.findById(req.user_id, function(err, user){
            if(!user){
                res.send({status: 404, message: 'User Not Found'});
            } else {
            if (err) {
                res.send({status: 404, message: 'Not Found'});
            } else {
                res.send({status: 200, message: 'Data successfully', data:user});
            }
        }
        });
    }


    var editProfile = function(req, res){
        User.findById(req.user_id, function(err, user)  {
            if(!user){
                res.send({status: 404, message: 'User Not Found'});
            } else {
            // Handle any possible database errors
            if (err) {
                res.status(500).send(err);
            } else {
                // Update each attribute with any possible attribute that may have been submitted in the body of the request
                // If that attribute isn't in the request body, default back to whatever it was before.
                var imageSaver = new ImageSaver();
                user.name = req.body.name || user.name;
                user.birthday = req.body.birthday || user.birhtday;
                user.gender = req.body.gender || user.gender;
                user.email = req.body.email || user.email;
                user.telephone = req.body.telephone || user.telephone;
                user.identity_number = req.body.identity_number || user.identity_number;
                user.photo = user.photo || user.photo;
                var pictname = new Date().getTime();
                if(req.body.photo!=null){
			  		user.photo="https://travinesia.com:3000/upload/photo/"+pictname+".jpg";
					imageSaver.saveFile("public/image"+pictname+".jpg",req.body.photo)
					.then((data)=>{
						console.log("upload photo success");
			    		})
		    		.catch((err)=>{
						res.json({status:400,message:err});
						})
                    }
                // Save the updated document back to the database
                user.save(function(err, user) {
                    if (err) {
                        res.status(500).send(err)
                    }
                    res.status(200).send(user);
                });
            }
        }
        });


    }

    var modifyPassword = function (req, res, next) {
        User.findById(req.user_id).select('name email password').exec(function(err, user){
            //if (err) throw err;
            if(!user){
                res.send({status: 404, message: 'User Not Found'});
            } else if (user){
                if (req.body.password) {
                    var comparePassword = user.comparePassword(req.body.password);
                } else {
                    res.json({ status : 400, success: false, message: 'No password provided' });
                    return next();
                }
                if (!comparePassword){
                    res.json({ status : 400, success: false, message: 'Wrong Old Password' });
                    return next();
                } else {
                    var new_password = req.body.new_password;
                    if (new_password) {
                        user.password = new_password;
                        user.save(function(err, user){
                            if (err) {
                                res.status(500).send(err)
                            } else {
                                res.send({status: 200, message: 'Password has been changed!', data:user});
                            }
                        })
                    } else {
                        res.json({ status : 400, success: false, message: 'Please insert your new password!' });
                    }
            }
    }
    });
    }

    var registerProvider = function(req, res) {

        var provider = new Provider();
        provider.id_user = req.id_user;
        provider.travel_name = req.body.travel_name;
        provider.slogan = req.body.slogan;
        provider.description = req.body.description;
        provider.office_address = req.body.office_address;
        provider.province = req.body.province;
        provider.office_phone_number = req.body.office_phone_number;
        provider.domain = req.body.domain;
        provider.logo = req.body.logo;
        var imageSaver = new ImageSaver();
        var pictname = new Date().getTime();
        if(req.body.logo!=null){
            provider.logo="https://travinesia.com:3000/upload/photo/"+pictname+".jpg";
          imageSaver.saveFile("public/image"+pictname+".jpg",req.body.logo)
          .then((data)=>{
              console.log("upload photo success");
              })
          .catch((err)=>{
              res.json({status:400,message:err});
              })
        }
        if (req.body.travel_name == null || req.body.travel_name == '' || req.body.slogan == null || req.body.slogan == '' || req.body.description == null || req.body.description == '' || req.body.office_address == null || req.body.office_address == '' || req.body.province == null || req.body.province == '' || req.body.office_phone_number == null || req.body.office_phone_number == '' || req.body.domain == null || req.body.domain == '' ) {
            // if(req.body == null || req.body == '') {
            res.json({ status: 400, success: false, message: 'Make sure you fill out all the forms' });
        } else {
            provider.save(function(err, provider){
                if (err) {
                    res.status(500).send(err)
                } else {
                    res.send({status: 200, message: 'Provider registered!'});
                }
            })
        }
    }
    var addbooking = function(req,res){
        var booking = new Booking();
        booking.id_user = req.id_user;
        booking.id_statustrip = req.id_statustrip;
        booking.id_paymentMethod = req.id_paymentMethod;
        booking.id_statusPayment = req.id_statusPayment;
        booking.id_typeTrip = req.id_typeTrip;
        booking.booking_code = req.body.booking_code;
        booking.quantity = req.body.quantity;
        booking.name_traveller = req.body.name_traveller;
        booking.age_traveller = req.body.age_traveller;
        booking.total_amount = req.body.total_amount;
        booking.coded_amount = req.body.coded_amount;
        booking.uniq_code = req.body.uniq_code;
        booking.pay_before = req.body.pay_before;
        booking.expired = req.body.expired;

    // if(req.quantity == 0 || req.quantity == null) {
    //     res.json({ success: false, message: 'sampun telas quotanya' });
    // } else {
    //     var quantity = quantity - req.body.quantity;
    // };



    }




module.exports = {
    getProfile:getProfile,
    editProfile:editProfile,
    modifyPassword:modifyPassword,
    registerProvider:registerProvider,
    addbooking: addbooking
}
