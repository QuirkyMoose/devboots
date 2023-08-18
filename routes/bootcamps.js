const express = require('express');
const Bootcamp = require('../models/Bootcamp');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
const {
     getBootcamps,
     getBootcamp,
     createBootcamp, 
     updateBootcamp, 
     deleteBootcamp,
     getBootcampInRadius,
    bootcampPhotoUpload
    } = require('../controllers/bootcamps')

const courseRouter = require('./courses');
const reviewRouter = require('./reviews');

router.use('/:bootcampId/courses', courseRouter)
router.use('/:bootcampId/reviews', reviewRouter)

router.route('/radius/:zipcode/:distance').get(getBootcampInRadius)

router.route('/:id/photo').put(bootcampPhotoUpload)

router.route('/')
    .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
    .post(protect, authorize('publisher', 'admin'), createBootcamp)


router.route('/:id')
    .get(getBootcamp)
    .put(protect, authorize('publisher', 'admin'), updateBootcamp)
    .delete(protect,authorize('publisher', 'admin'), deleteBootcamp)

module.exports = router;