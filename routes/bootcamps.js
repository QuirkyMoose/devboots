const express = require('express');
const { protect, authorize } = require('../middleware/auth')
const router = express.Router();
const {
     getBootcamps,
     getBootcamp,
     createBootcamp, 
     updateBootcamp, 
     deleteBootcamp,
     getBootcampInRadius
    } = require('../controllers/bootcamps')

const courseRouter = require('./courses');

router.use('/:bootcampId/courses', courseRouter)

router.route('/radius/:zipcode/:distance').get(getBootcampInRadius)


router.route('/')
    .get(getBootcamps)
    .post(protect, authorize('publisher', 'admin'), createBootcamp)


router.route('/:id')
    .get(getBootcamp)
    .put(protect, authorize('publisher', 'admin'), updateBootcamp)
    .delete(protect,authorize('publisher', 'admin'), deleteBootcamp)

module.exports = router;