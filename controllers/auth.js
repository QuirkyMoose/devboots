const crypto = require('crypto');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');



//@desc Register User
//@route POST /api/v1/auth/register
//@access Public

exports.register = asyncHandler(async (req,res,next)=>{
    const {name,email,password,role} = req.body;
    let user = await User.findOne({name,role})
    if(user){
        return res.status(404).json({success: true, message: 'user already exists'})
    }
    user = await User.create({
        name,
        email,
        password,
        role
    });

    sendTokenResponse(user, 200, res)
})

//@desc Login User
//@route POST /api/v1/auth/login
//@access Public

exports.login = asyncHandler(async (req,res,next)=>{

    //Validate email and password
    const {email,password} = req.body;
    if (!email || !password){
        return next(new ErrorResponse('Please provide an email and password', 400))
    };

    //Check for user
    const user = await User.findOne({email}).select('+password');
    if(!user){
        return next(new ErrorResponse('Invalid Credentials', 401));
    }
    //Validate pasword
    const isMatch = await user.matchPassword(password);
    if(!isMatch){
       return next(new ErrorResponse('Invalid Credentials', 401));
    }
    sendTokenResponse(user, 200, res)

})

 //@desc Logout current user
//@route GET /api/v1/auth/logout
//@access Private

exports.logout = asyncHandler(async(req,res,next)=>{
    res.cookie('token', 'none', {
        expiresIn: new Date(Date.now() + 10*1000),
        httpOnly:true,
    })
    res.status(200).json({success:true, data:{}})
})




//@desc Forgot password 
//@route POST /api/v1/auth/forgotpassword
//@access Public

exports.forgotPassword = asyncHandler(async(req,res,next)=>{

    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new ErrorResponse('There is no user with that email', 404))
    }
    //Get reset token
    const resetToken = user.getResetPasswordToken(); //resetToken is the unhashed token returned from the method
    await user.save({validateBeforeSave: false});

    //Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password.
                     Please make a PUT request to: \n\n ${resetUrl}`;
    try {
        await sendEmail({
            email: user.email,
            subject: 'Password reset token',
            message
        });
        res.status(200).json({success:true, data:'Email sent'})
    } catch (error) {
        console.log(error);
        user.resetPasswordToken = undefined; //after password has been reset, remove the token
        user.resetPasswordExpire = undefined;
        await user.save({validateBeforeSave: false});
        return next(new ErrorResponse('Email could not be sent', 500))
    }

})

//@desc Reset password 
//@route PUT /api/v1/auth/resetpassword/:resettoken
//@access Public
 exports.resetPassword  = asyncHandler(async(req,res,next)=>{

    //get token from url:params
    //convert to hashed token
    //find user by hashed token
    //check if token has expired

    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt: Date.now()}
    })

    if (!user){
        return next(new ErrorResponse('Invalid token', 400))
    }
    
    //set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    sendTokenResponse(user, 200, res);

 })

 //@desc Get current user logged in
//@route GET /api/v1/auth/me
//@access Private

exports.getMe = asyncHandler(async(req,res,next)=>{
    const user = await User.findById(req.user.id)
    res.status(200).json({success:true, data:user})
})


//@desc Update user details
//@route PUT /api/v1/auth/updatedetails
//@access Private

exports.updateDetails = asyncHandler(async(req,res,next)=>{

    //console.log(req.user.id);
    //console.log(req.user);

    if (!req.body.email || !req.body.name){
        return next(new ErrorResponse('Please provide an email and name', 400))
    }
    
    const fieldsToUpdate = {
        email: req.body.email,
        name: req.body.name
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate,{new:true, runValidators:true});
    res.status(200).json({success:true, data:user})


});

 //@desc Update password
//@route PUT /api/v1/auth/updatepassword
//@access Private

exports.updatePassword = asyncHandler(async(req,res,next)=>{
    
    const user = await User.findById(req.user.id).select('+password');

    if(!(await user.matchPassword(req.body.currentPassword))){
        return next(new ErrorResponse('Password is incorrect', 401))
    }
    user.password = req.body.newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
});


//Get token from model, create cookie and send response
const sendTokenResponse = (user, StatusCode, res )=>{

    const token = user.getSignedJwtToken();
    const options = {
        expiresIn: new Date(Date.now() + process.env.COOKIE_EXPIRES*24*60*60*1000),
        httpOnly:true,
    }
    res
    .status(StatusCode)
    .cookie('token', token, options)
    .json({
        success: true,
        token
    })
}
