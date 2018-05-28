'use strict'
/* GET 'about' page */
module.exports.about = (req, res) => {
  res.render('generic-text', { title: 'About'})
}
