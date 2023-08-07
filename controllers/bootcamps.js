const Bootcamp = require('../models/Bootcamp')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const geocoder = require('../utils/geocoder')


//@desc Get all bootcamps
//@route GET /api/v1/bootcamps
//@access Public
exports.getBootcamps = asyncHandler(async (req,res,next)=>{
     
        let query;
        const reqQuery = {...req.query}; // copy req.query into reqQuery
        const removeFields = ['select','sort','limit','page'] // specify fields to delete from reqQuery
        //mongo treats parameters in our queries as fields, but select and a couple other keywords aren't fields in out database, we need to remove it from our copied query object so the keywords can maintain its characteristics 

        removeFields.forEach(param => delete reqQuery[param]) // remove specified fields from reqQuery, these fields are special characters that enable us perform specific functions
        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        query = Bootcamp.find(JSON.parse(queryStr)).populate({
                path:'courses',
                select:'title description'
        });

        if(req.query.select){
                let str = req.query.select.split(',').join(' ');//returns parameter passed into select ie select=name,description and then splits it on the comma and then joins it with a space, returns the results into the variable str
                //select query syntax : query.select('name occupation')
                query = query.select(str)//query becomes query.select(str) str being the comma seperated parameters passed into select
        }

        if(req.query.sort){
                let sortBy = req.query.sort.split(',').join(' ')
                query = query.sort(sortBy)
        }

        //Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 100;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Bootcamp.countDocuments(JSON.parse(queryStr));

        query = query.skip(startIndex).limit(limit)



        //Execute Query
        const bootcamp = await query;
        
        //pagination result
        const pagination = {};

        if(endIndex < total){
                pagination.next = {
                        page: page + 1,
                        limit
                }
        }
        if(startIndex > 0 && bootcamp != ''){
                pagination.prev = {
                        page: page - 1,
                        limit
                }
        }

        res.status(200).json({ success:true, count: bootcamp.length, pagination, msg: bootcamp})
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

        const bootcamp = await Bootcamp.create(req.body)
        res.status(201).json({ success:true, msg:bootcamp })
})

//@desc Update bootcamp
//@route PUT /api/v1/bootcamps/:id
//@access Private
exports.updateBootcamp = asyncHandler(async (req,res,next)=>{
        const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true
        })
        if(!bootcamp){
            return next(new ErrorResponse(`Resource not found with id ${req.params.id}`,404))
        }
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
