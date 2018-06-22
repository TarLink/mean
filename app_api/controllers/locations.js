const mongoose = require('mongoose');
const Loc = mongoose.model('Location');

const sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};


const theEarth = (() => {
  const earthRadius = 6371; // km, miles is 3959

  const getDistanceFromRads = function(rads) {
    return parseFloat(rads * earthRadius);
  };

  const getRadsFromDistance = function(distance) {
    return parseFloat(distance / earthRadius);
  };

  return {
    getDistanceFromRads: getDistanceFromRads,
    getRadsFromDistance: getRadsFromDistance
  }
})()

/* GET list of locations */
module.exports.locationsListByDistance = (req, res) =>  {
  const lng = parseFloat(req.query.lng)
  const lat = parseFloat(req.query.lat)
  const maxDistance = parseFloat(req.query.maxDistance)
  if (!lng || !lat || !maxDistance) {
    console.log('locationsListByDistance missing params');
    sendJSONresponse(res, 404, {
      "message": "lng, lat and maxDistance query parameters are all required"
    });
    return;
  }
  Loc.aggregate([
      {
          $geoNear: {
              near: { type: "Point" , coordinates: [lng, lat ] },
              spherical: true,
              limit: 10,
              distanceField: "dist.calculated",
              maxDistance: maxDistance,
              spherical: true
          }
      }
  ]).then((err, results) => {
        let locations;
        console.info('Geo Results', results)
        if (err) {
          console.log('geoNear error:', err)
          console.log(results)
          console.log(JSON.stringify({alex:[{a:1,b:2},{a:2,b:1}]}))
          sendJSONresponse(res, 404, err)
        } else {
          console.log('strange')
          locations = buildLocationList(req, res, results)
          sendJSONresponse(res, 200, locations)
        }
  }, error => {
    console.log(error)
  })
}

const buildLocationList = (req, res, results) => {
  let locations = []
  results.forEach((doc) => {
    locations.push({
      distance: theEarth.getDistanceFromRads(doc.dis),
      name: doc.obj.name,
      address: doc.obj.address,
      rating: doc.obj.rating,
      facilities: doc.obj.facilities,
      _id: doc.obj._id
    })
  })
  return locations
}


/* GET a location by the id
 * /locations/:locationid
 */
module.exports.locationsReadOne = (req, res) => {
  console.log('Finding location details', req.params)
    if (req.params && req.params.locationid) {
      Loc
        .findById(req.params.locationid)
        .exec((err, location) => {
          if (!location) {
            sendJSONresponse(res, 404, {
              "message": "locationid not found"
            })
            return;
          } else if (err) {
            console.log(err);
            sendJSONresponse(res, 404, err);
            return;
          }
          console.log(location)
          sendJSONresponse(res, 200, location)
        })
    } else {
      console.log('No locationid specified')
      sendJSONresponse(res, 404, {
        "message": "No locationid in request"
      })
    }
}

/* POST a new location */
/* /api/locations */
module.exports.locationsCreate = (req, res) => {
  Loc.create({
    name: req.body.name,
    address: req.body.address,
    facilities: req.body.facilities.split(","),
    coords: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
    openingTimes: [{
      days: req.body.days1,
      opening: req.body.opening1,
      closing: req.body.closing1,
      closed: req.body.closed1,
    }, {
      days: req.body.days2,
      opening: req.body.opening2,
      closing: req.body.closing2,
      closed: req.body.closed2,
    }]
  }, (err, location) => {
    if (err) {
      sendJsonResponse(res, 400, err)
    } else {
      sendJsonResponse(res, 201, location)
    }
  })
};

/* PUT /api/locations/:locationid */
module.exports.locationsUpdateOne = (req, res) => {
  if (!req.params.locationid) {
    sendJSONresponse(res, 404, {
      "message": "Not found, locationid is required"
    })
    return
  }
  Loc
    .findById(req.params.locationid)
    .select('-reviews -rating')
    .exec(
      function(err, location) {
        if (!location) {
          sendJSONresponse(res, 404, {
            "message": "locationid not found"
          })
          return
        } else if (err) {
          sendJSONresponse(res, 400, err)
          return
        }
        location.name = req.body.name
        location.address = req.body.address
        location.facilities = req.body.facilities.split(",")
        location.coords = [parseFloat(req.body.lng), parseFloat(req.body.lat)];
        location.openingTimes = [{
          days: req.body.days1,
          opening: req.body.opening1,
          closing: req.body.closing1,
          closed: req.body.closed1,
        }, {
          days: req.body.days2,
          opening: req.body.opening2,
          closing: req.body.closing2,
          closed: req.body.closed2,
        }];
        location.save(function(err, location) {
          if (err) {
            sendJSONresponse(res, 404, err)
          } else {
            sendJSONresponse(res, 200, location)
          }
        })
      }
  )
}

/* DELETE /api/locations/:locationid */
module.exports.locationsDeleteOne = function(req, res) {
  sendJSONresponse(res, 200, {"status": "success"})
};
