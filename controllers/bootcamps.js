const path = require('path');
const Bootcamp = require('../models/Bootcamp');
const advancedResults = require('../middleware/advancedResults');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');


//@desc Get all bootcamps
//@route GET /api/v1/bootcamps
//@access Public
exports.getBootcamps = asyncHandler(async (req,res,next)=>{
        res.status(200).json(res.advancedResults); //res.advancedResults is from advancedResults middleware
})
      


//@desc Get single bootcamps
//@route GET /api/v1/bootcamps/:id
//@access Public
exports.getBootcamp = asyncHandler(async (req,res,next)=>{
        const bootcamp = await Bootcamp.findById(req.params.id);
        if(!bootcamp){
            return next(new ErrorResponse(`Resource not found with id ${req.params.id}`,404))
        }
        res.status(200).json({ success:true, data:bootcamp})  
})

//@desc Create new bootcamp
//@route POST /api/v1/bootcamps
//@access Private
exports.createBootcamp = asyncHandler(async (req,res,next)=>{
        //Add user to req.body 
        req.body.user = req.user.id;

        //check if user has already published a bootcamp
        const publishedBootcamp = await Bootcamp.findOne({user: req.user.id});

        //If user is not an admin, they can only add one bootcamp
        if(publishedBootcamp && req.user.role !== 'admin'){ 
                return next(new ErrorResponse(`User with id ${req.user.id} has already published a bootcamp`,400))
        };

        const bootcamp = await Bootcamp.create(req.body)
        res.status(201).json({ success:true, msg:bootcamp })
})

//@desc Update bootcamp
//@route PUT /api/v1/bootcamps/:id
//@access Private
exports.updateBootcamp = asyncHandler(async (req,res,next)=>{
        let bootcamp = await Bootcamp.findById(req.params.id);
        if(!bootcamp){
                return next(new ErrorResponse(`Resource not found with id ${req.params.id}`,404))
        }
        //Make sure user is bootcamp owner
        if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
                return next(new ErrorResponse(`User with id ${req.user.id} is not authorized to update this bootcamp`,401))
        }
        bootcamp = Bootcamp.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true})
        res.status(200).json({ success:true, success:req.body})   
})

//@desc Delete bootcamp
//@route DELETE /api/v1/bootcamps/:id
//@access Private
exports.deleteBootcamp = asyncHandler(async (req,res,next)=>{

        const bootcamp = await Bootcamp.findById(req.params.id);
        if(!bootcamp){
            return next(new ErrorResponse(`Resource not found with id ${req.params.id}`,404))
        }

         //Make sure user is bootcamp owner
        if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
                return next(new ErrorResponse(`User with id ${req.user.id} is not authorized to delete this bootcamp`,401))
        }
        
        await bootcamp.deleteOne();
        res.status(200).json({ success:true, msg: `${req.params.id} deleted`})
})

//@desc Get bootcamp within specified radius 
//@route GET /api/v1/bootcamps/radius/:zipcode/:distance
//@access Private
exports.getBootcampInRadius = asyncHandler(async (req,res,next)=>{
        const {zipcode, distance} = req.params;

        //Get lat and long from geocoder
        const loc = await geocoder.geocode(zipcode);
        const lat = loc[0].latitude;
        const long = loc[0].longitude;

        //Cal radius using radians
        //Divide distance by earth radius 
        //Earth radius = 3963 mi/ 6378km

        const radius = distance/3963;
        const bootcamps = await Bootcamp.find({
                location: { $geoWithin: { $centerSphere: [[long,lat], radius]}}
        });

        res.status(200).json({
                success: true,
                count: bootcamps.length,
                data: bootcamps
        });

})


//@desc Upload photo for bootcamp
//@route PUT /api/v1/bootcamps/:id/photo
//@access Private
exports.bootcampPhotoUpload = asyncHandler(async (req,res,next)=>{

        const bootcamp = await Bootcamp.findById(req.params.id);
        if(!bootcamp){
            return next(new ErrorResponse(`Resource not found with id ${req.params.id}`,404))
        }
        if(!req.files){
                return next(new ErrorResponse(`Please upload a file`,400))
        } //check if file was uploaded

        // console.log(req.files);
        // console.log(req.files.files.mimetype);
        const file = req.files.files;
        
        if(!file.mimetype.startsWith('image')){
                return next(new ErrorResponse(`Please upload an image file`,400))
        } //check if file is an image

        if(file.size > process.env.MAX_FILE_UPLOAD){
                return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,400))
        } //check if file is less than 1mb

        //Create custom filename
        file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`; //path.parse(file.name).ext returns the extension of the file

        file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err =>{
                if(err){
                        console.error(err);
                        return next(new ErrorResponse(`Problem with file upload`,500))
                }
                await Bootcamp.findByIdAndUpdate(req.params.id, {photo: file.name});
                res.status(200).json({
                        success:true,
                        data: file.name
                })
        })


        
})