const asyncHandler = require('../middleware/async');
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


//@desc Get c userurrent logged in
//@route POST /api/v1/auth/me
//@access Private


exports.getMe = asyncHandler(async(req,res,next)=>{
    const user = await User.findById(req.user.id)
    res.status(200).json({success:true, data:user})
})