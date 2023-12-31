const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err,req,res,next)=>{
    let error = {...err} //copies enumurable properties from err into error
    error.message = err.message //err.message isn't an enumurable property so we force its copy into error.message with this syntax

    console.log(err);

    //Mongoose bad ObjectId
    if (err.name === 'CastError'){
        const message = `Resource not found`
        error = new ErrorResponse(message,404)
    }

    //Mongoose duplicate key
    if (err.code === 11000){
        const message = `Duplicate field value entered`
        error = new ErrorResponse(message,400)
    }

    //Mongoose validation error
    if (err.name === 'ValidationError'){
        const message = Object.values(err.errors).map(val => val.message)
        error = new ErrorResponse(message,400)
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error:error.message || 'Server Error'})
}

module.exports = errorHandler