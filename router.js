const express = require('express');
const router = require('express').Router();
const axios = require('axios');
// const mongodb = require('./db/mongo.js');
// const artist = require('./db/mongoModels/artistModel.js');

router.get('/movieDetails', (req, res) => {

  var movieName = encodeURI(req.query.movieName);
  console.log('MOVIE NAME', movieName)
  var q = `query%20%7B%0A%20%20movie(title%3A%20%22${movieName}%22)%20%7B%0A%20%20%20%20title%0A%20%20%20%20id%0A%20%20%20%20overview%0A%20%20%20%20voteAverage%0A%20%20%20%20poster%0A%20%20%20%20details%20%7B%0A%20%20%20%20%20%20runtime%0A%20%20%20%20%20%20website%0A%20%20%20%20%20%20budget%0A%20%20%20%20%20%20revenue%0A%20%20%20%20%20%20tagline%0A%20%20%20%20%7D%0A%20%20%20%20%0A%20%20%20%20similar%20%7B%0A%20%20%20%20%09title%0A%20%20%20%20%09id%0A%20%20%20%20%09overview%0A%20%20%20%20%09voteAverage%0A%20%20%20%20%20%20poster%0A%20%20%20%20%7D%0A%20%20%20%20%0A%20%20%20%20recommendations%20%7B%0A%20%20%20%20%20%20title%0A%20%20%20%20%09id%0A%20%20%20%20%09overview%0A%20%20%20%20%09voteAverage%0A%20%20%20%20%20%20poster%0A%20%20%20%20%7D%0A%20%20%20%20%0A%20%20%20%20keywords%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20word%0A%20%20%20%20%7D%0A%20%20%20%20%0A%20%20%7D%0A%7D%0A`
  axios.get(`0.0.108.134:${process.env.PORT || 5000}/graphql?query=${q}`)
  .then((response) => {
    console.log('RES FROM MY API', response.data);
    res.send(response.data)
  })
  .catch((err) => console.log('ERROR', err))

})


module.exports = router;
