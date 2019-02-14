const express = require('express');
const router = express.Router();
const cors = require('cors')

const bookApi = require('./book');
const authorApi = require('./author')

router.use(cors())

router.get('/', function(req, res, next) {
  res.send("api root")
});

router.use('/book', bookApi)
router.use('/author', authorApi);

module.exports = router;
