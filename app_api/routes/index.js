'use strict'
const express = require('express')
const router = express.Router()
const ctrlLocations = require('../controllers/locations')
const ctrlReviews = require('../controllers/reviews')

router.get('/locations', ctrlLocations.locationsListByDistance)
router.post('/locations', ctrlLocations.locationsCreate)
router.get('/locations/:locationid', ctrlLocations.locationsReadOne)
router.put('/locations/:locationid', ctrlLocations.locationsUpdateOne)
router.delete('/locations/:locationid', ctrlLocations.locationsDeleteOne)

// reviews
router.post('/locations/:locationid/reviews', ctrlReviews.reviewsCreate)
router.get('/locations/:locationid/reviews/:reviewid', ctrlReviews.reviewsReadOne)
router.put('/locations/:locationid/reviews/:reviewid', ctrlReviews.reviewsUpdateOne)
router.delete('/locations/:locationid/reviews/:reviewid', ctrlReviews.reviewsDeleteOne)

module.exports = router;
