const express = require('express');
const router = express.Router();
const cors = require('cors')

const bookApi = require('./book');
const authorApi = require('./author');
const genreApi = require('./genre');
const oauthRouter = require('./oauth');
const userApi = require('./user');

router.use(cors())

router.get('/', function(req, res, next) {
  res.send("api root")
});

router.use('/book', bookApi)
router.use('/author', authorApi);
router.use('/genre', genreApi);

router.use('/oauth', oauthRouter)

router.use('/user', userApi)

module.exports = router;
