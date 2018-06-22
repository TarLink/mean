const mongoose = require('mongoose');
const Loc = mongoose.model('Location');

const sendJSONresponse = (res, status, content) => {
  res.status(status);
  res.json(content);
};

const doAddReview = (req, res, location) => {
  if (!location) {
    sendJsonResponse(res, 404, {
      "message": "locationid not found"
    })
  } else {
    location.reviews.push({
      author: req.body.author,
      rating: req.body.rating,
      reviewText: req.body.reviewText
    })
    location.save((err, location) => {
      let thisReview
      if (err) {
        sendJsonResponse(res, 400, err)
      } else {
        updateAverageRating(location._id)
        thisReview = location.reviews[location.reviews.length - 1]
        sendJsonResponse(res, 201, thisReview)
      }
    })
  }
}

const updateAverageRating = (locationid) => {
  Loc
    .findById(locationid)
    .select('rating reviews')
    .exec( (err, location) => {
      if (!err) {
        doSetAverageRating(location)
      }
    })
}

const doSetAverageRating = (location) => {
  let i, reviewCount, ratingAverage, ratingTotal
  if (location.reviews && location.reviews.length > 0) {
    reviewCount = location.reviews.length
    ratingTotal = 0
    for (i = 0; i < reviewCount; i++) {
      ratingTotal = ratingTotal + location.reviews[i].rating
    }
    ratingAverage = parseInt(ratingTotal / reviewCount, 10)
    location.rating = ratingAverage
    location.save( (err) => {
      if (err) {
        console.log(err)
      } else {
        console.log("Average rating updated to", ratingAverage)
      }
    })
  }
}

/* POST a new review, providing a locationid */
/* /api/locations/:locationid/reviews */
module.exports.reviewsCreate = (req, res) => {
  let locationid = req.params.locationid
  if (locationid) {
    Loc
      .findById(locationid)
      .select('reviews')
      .exec(
        (err, location) => {
          if (err) {
            sendJsonResponse(res, 400, err)
          } else {
            doAddReview(req, res, location)
          }
        }
      )
  } else {
    sendJsonResponse(res, 404, {
      "message": "Not found, locationid required"
    })
  }
};




module.exports.reviewsUpdateOne = (req, res) => {
  if (!req.params.locationid || !req.params.reviewid) {
    sendJSONresponse(res, 404, {
      "message": "Not found, locationid and reviewid are both required"
    });
    return
  }
  Loc
    .findById(req.params.locationid)
    .select('reviews')
    .exec(
      function(err, location) {
        let thisReview
        if (!location) {
          sendJSONresponse(res, 404, {
            "message": "locationid not found"
          })
          return
        } else if (err) {
          sendJSONresponse(res, 400, err);
          return;
        }
        if (location.reviews && location.reviews.length > 0) {
          thisReview = location.reviews.id(req.params.reviewid)
          if (!thisReview) {
            sendJSONresponse(res, 404, {
              "message": "reviewid not found"
            })
          } else {
            thisReview.author = req.body.author;
            thisReview.rating = req.body.rating;
            thisReview.reviewText = req.body.reviewText;
            location.save(function(err, location) {
              if (err) {
                sendJSONresponse(res, 404, err)
              } else {
                updateAverageRating(location._id)
                sendJSONresponse(res, 200, thisReview)
              }
            })
          }
        } else {
          sendJSONresponse(res, 404, {
            "message": "No review to update"
          })
        }
      }
  )
}


module.exports.reviewsReadOne = (req, res) => {
  console.log("Getting single review")
  if (req.params && req.params.locationid && req.params.reviewid) {
    Loc
      .findById(req.params.locationid)
      .select('name reviews')
      .exec(
        function(err, location) {
          console.log(location)
          let response, review;
          if (!location) {
            sendJSONresponse(res, 404, {
              "message": "locationid not found"
            });
            return;
          } else if (err) {
            sendJSONresponse(res, 400, err)
            return;
          }
          if (location.reviews && location.reviews.length > 0) {
            review = location.reviews.id(req.params.reviewid)
            if (!review) {
              sendJSONresponse(res, 404, {
                "message": "reviewid not found"
              });
            } else {
              response = {
                location: {
                  name: location.name,
                  id: req.params.locationid
                },
                review: review
              };
              sendJSONresponse(res, 200, response)
            }
          } else {
            sendJSONresponse(res, 404, {
              "message": "No reviews found"
            });
          }
        }
    );
  } else {
    sendJSONresponse(res, 404, {
      "message": "Not found, locationid and reviewid are both required"
    })
  }
}


// app.delete('/api/locations/:locationid/reviews/:reviewid'
module.exports.reviewsDeleteOne = (req, res) => {
  if (!req.params.locationid || !req.params.reviewid) {
    sendJSONresponse(res, 404, {
      "message": "Not found, locationid and reviewid are both required"
    })
    return
  }
  Loc
    .findById(req.params.locationid)
    .select('reviews')
    .exec(
      function(err, location) {
        if (!location) {
          sendJSONresponse(res, 404, {
            "message": "locationid not found"
          });
          return
        } else if (err) {
          sendJSONresponse(res, 400, err);
          return
        }
        if (location.reviews && location.reviews.length > 0) {
          if (!location.reviews.id(req.params.reviewid)) {
            sendJSONresponse(res, 404, {
              "message": "reviewid not found"
            })
          } else {
            location.reviews.id(req.params.reviewid).remove();
            location.save(function(err) {
              if (err) {
                sendJSONresponse(res, 404, err);
              } else {
                updateAverageRating(location._id);
                sendJSONresponse(res, 204, null);
              }
            })
          }
        } else {
          sendJSONresponse(res, 404, {
            "message": "No review to delete"
          })
        }
      }
  )
}