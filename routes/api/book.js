const express = require('express');
const router = express.Router();
const multer  = require('multer')
const upload = multer()
const async = require('async');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

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

router.post('/',
// parse multpart/form-data
upload.none(),

// convert the genre to an array
(req, res, next) => {
  req.body.genre = JSON.parse(req.body.genre)
  next()
},
(req, res, next ) => {
  console.log(req.body)
  // console.log(typeof req.body.genre[0])
  // console.log(typeof JSON.parse(req.body.genre)[0])
  // console.log(typeof req.body.genre[0] === typeof JSON.parse(req.body.genre)[0])
  next();
},
// validate fields
body('title', 'Title must not be empty.').isLength({min:1}).trim(),

// sanitize fields (using wildcard)
sanitizeBody('*').trim().escape(),

// Process request after validation and sanitization
(req, res, next) => {
  // Extract the validation errors from a request.
  const errors = validationResult(req);

  // Create a Book Object with escaped and trimmed data.
  console.log('after validation and sanitization')
  console.log({ title: req.body.title,
    author: req.body.author,
    summary: req.body.summary,
    isbn: req.body.isbn,
    genre: req.body.genre
   })
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    summary: req.body.summary,
    isbn: req.body.isbn,
    genre: req.body.genre
  })

  if (!errors.isEmpty()) {
    // 如果验证有错误
    console.log(errors.array())
    return res.json({msg:'validation failed', errors: errors.array()})
  } else {
    // 验证没错
    book.save(function(err) {
      // 如果保存出错
      if (err) return res.json({msg: 'save failed', err})
      // 如果保存没出错
      res.json({msg: 'book saved', book})
    })
  }
}
)

module.exports = router;
