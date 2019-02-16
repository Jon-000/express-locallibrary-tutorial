const express = require('express');
const router = express.Router();
const async = require('async');

const Book = require('../../models/book');
const Bookinstance = require('../../models/bookinstance');

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
  // res.send(req.params.id)
  async.parallel(
    {
      book: function(cb) {
        Book.findById(req.params.id).exec(cb)
      },
      bookinstance_of_book: function(cb) {
        Bookinstance
          .find({book: req.params.id})
          .exec(cb)
      }
    },
    function(err, results) {
      if (err) return next(err);
      if (results.book == null) {
        return res.json({msg: "no book exist"})
      }
      if (results.bookinstance_of_book.length === 0) {
        console.log('dsfffffffffff')
        results.book.delete((err, book_d) => {
          if (err) return res.json({msg: "err when delete", err});
          return res.json({msg: "delete book successfully", book_d})
        })
      } else {
        return res.json({
          msg: "can't delete this book, there  are still bookinstances belong to this book",
          book: results.book,
          bookinstance_of_book: results.bookinstance_of_book
        })
      }
    }
  )
})

router.post('/', function(req, res, next) {
  
})

module.exports = router;
