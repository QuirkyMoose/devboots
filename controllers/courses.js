const Course = require('../models/Course')
const asyncHandler = require('../middleware/async');
const Bootcamp = require('../models/Bootcamp')
const ErrorResponse = require('../utils/errorResponse');

//@desc Get all courses
//@route GET /api/v1/courses
//@route GET /api/v1/bootcamps/:bootcampId/courses
//@access Public

exports.getCourses = asyncHandler(async (req,res,next)=>{
    if (req.params.bootcampId){
        const courses = Course.find({bootcamp: req.params.bootcampId})
        return res.status(200).json({ success:true, count: courses.length, msg: courses});
    } else {
        res.status(200).json(res.advancedResults);
}})

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

exports.addCourse = asyncHandler(async (req,res,next) =>{
    req.body.bootcamp = req.params.bootcampId;  //manually set bootcamp field in Course model to bootcampId from Bootcamp model
    req.body.user = req.user.id; //manually set user field in Course model to user id from User model
    const bootcamp = await Bootcamp.findById(req.params.bootcampId);
    if(!bootcamp){
        next(new ErrorResponse(`No bootcamp with id ${req.params.id}`, 404))
    }
    //Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorResponse(`User with id ${req.user.id} is not authorized to add a course to ${bootcamp._id}`,401))
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
    //Make sure user is course owner
    if(course.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorResponse(`User with id ${req.user.id} is not authorized to update this course`,401))
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
    //Make sure user is course owner
    if(course.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorResponse(`User with id ${req.user.id} is not authorized to delete this course`,401))
    }
    await course.deleteOne();

    res.status(200).json({success: true, data:{}})
})


