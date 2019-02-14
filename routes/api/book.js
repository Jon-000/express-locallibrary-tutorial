const express = require('express');
const router = express.Router();


const Book = require('../../models/book');

/* GET home page. */
router.get('/', function(req, res, next) {
  Book
    .find()
    .populate('author')
    .exec((err, result) => {
      if (err) next (err)
      res.status(200).json({msg:"find all books successfully", book_list: result});
    })
});

router.delete('/:id', (req, res, next) => {
  console.log(req.params.id)
  res.send(req.params.id)
})

module.exports = router;
