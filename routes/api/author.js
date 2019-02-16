const express = require('express');
const router = express.Router();


const Author = require('../../models/author');

/* GET home page. */
router.get('/', function(req, res, next) {
  Author
    .find()
    .populate('author')
    .exec((err, result) => {
      if (err) next (err)
      res.status(200)
        .json({
          msg:"find all authors successfully",
          author_list: result
        });
    })
});

router.delete('/:id', (req, res, next) => {
  res.send(req.params.id)
})

module.exports = router;
