const Course = require('../models/Course')
const asyncHandler = require('../middleware/async');
const Bootcamp = require('../models/Bootcamp')
const ErrorResponse = require('../utils/errorResponse');

//@desc Get all courses
//@route GET /api/v1/courses
//@route GET /api/v1/bootcamps/:bootcampId/courses
//@access Public

exports.getCourses = asyncHandler(async (req,res,next)=>{
    let query;
    if (req.params.bootcampId){
        query = Course.find({bootcamp: req.params.bootcampId})
    } else {
        query = Course.find().populate({
            path:'bootcamp',
            select:'name description',
            })}

    const courses = await query;
    res.status(200).json({ success:true, count: courses.length, msg: courses});

})

//@desc Get single course
//@route GET /api/v1/courses/:id
//@access Public

exports.getCourse = asyncHandler(async (req,res,next)=>{
  const course = await Course.findById(req.params.id).populate({
    path:'bootcamp',
    select: 'name description'
  })
  if(!course){
    return next(new ErrorResponse(`No course found with id ${req.params.id}`, 404) )
  }
    res.status(200).json({ success:true, msg: course});

})

//@desc Add course
//@route POST /api/v1/bootcamps/:bootcampId/courses
//@access Private

exports.addCourse = asyncHandler(async (req,res) =>{
    req.body.bootcamp = req.params.bootcampId;  //manually set bootcamp field in Course model to bootcampId from Bootcamp model
    const bootcamp = await Bootcamp.findById(req.params.bootcampId);
    if(!bootcamp){
        next(new ErrorResponse(`No bootcamp with id ${req.params.id}`, 404))
    }
    const course = await Course.create(req.body);
    res.status(201).json({success: true, data: course})
}) 


//@desc Update course
//@route PUT /api/v1/courses/:id
//@access Private

exports.updateCourse = asyncHandler(async(req,res,next) =>{
    let course = await Course.findById(req.params.id)

    if (!course){
        return next(new ErrorResponse(`Course with id ${req.params.id} does not exist`, 404))
    }
    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators:true
    })
    res.status(200).json({success: true, data:course})
})

//@desc Delete course
//@route DELETE /api/v1/courses/:id
//@access Private

exports.deleteCourse = asyncHandler(async(req,res,next) =>{
   const course = await Course.findById(req.params.id)

    if (!course){
        return next(new ErrorResponse(`Course with id ${req.params.id} does not exist`, 404))
    }
    await course.deleteOne();

    res.status(200).json({success: true, data:{}})
})


