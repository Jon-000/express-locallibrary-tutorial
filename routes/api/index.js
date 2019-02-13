const express = require('express');
const router = express.Router();

const bookApi = require('./book');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("api root")
});

router.use('/book', bookApi)

module.exports = router;
