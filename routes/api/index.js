const express = require('express');
const router = express.Router();
const cors = require('cors')

const bookApi = require('./book');

router.use(cors())

router.get('/', function(req, res, next) {
  res.send("api root")
});

router.use('/book', bookApi)

module.exports = router;
