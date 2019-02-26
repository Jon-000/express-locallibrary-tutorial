const express = require('express');
const router = express.Router();
const multer  = require('multer')
const upload = multer()
const async = require('async');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

const Book = require('../../models/book');
const Bookinstance = require('../../models/bookinstance');

const verifyJWT = require('../jwtAuthMiddle')

/* GET all books */
router.get('/', function(req, res, next) {
  Book
    .find()
    .populate('author')
    .exec((err, result) => {
      if (err) next (err)
      res.status(200).json({msg:"find all books successfully", book_list: result});
    })
});

// get one book detail
router.get('/:id', function(req, res, next) {
  async.parallel(
    {
      book: function(cb) {
        Book.findById(req.params.id)
          .populate('author')
          .populate('genre')
          .exec(cb)
      },
      book_instance_list: function(cb) {
        Bookinstance.find({book: req.params.id}).exec(cb)
      }
    },
    function(err, results) {
      if (err) {
        console.log(err)
        return res.status(500).json({msg: 'err'})
      }
      if (results.book === null) {
        return res.status(404).json({msg: 'book not found'})
      }
      return res.json({msg: 'find book and its instance successfully', results })
    }
  )
})

// delete one book
router.delete('/:id', verifyJWT, (req, res, next) => {
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


// post 和 update 表单的前处理逻辑是一样的，所以提出来
// 前处理包括，解析表单数据，去序列化前端表单序列化的nested json,验证表单数据，escape等安全性处理
const pre_process_form = [

  // 解析表单数据 parse multpart/form-data
  upload.none(),
  
  // convert the genre to an array
  (req, res, next) => {
    console.log(req.body)
    // req.body.title = JSON.parse(req.body.title)
    req.body.genre = JSON.parse(req.body.genre)
    next()
  },
  (req, res, next ) => {
    console.log('req.body: ')
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
  ]


// create new book
router.post('/',
// 检查jwt
verifyJWT,

pre_process_form,

// Process request after validation and sanitization
(req, res, next) => {
  // Extract the validation errors from a request.
  const errors = validationResult(req);

  // console.log('after validation and sanitization')
  // console.log({ title: req.body.title,
  //   author: req.body.author,
  //   summary: req.body.summary,
  //   isbn: req.body.isbn,
  //   genre: req.body.genre
  //  })

  // Create a Book Object with escaped and trimmed data.
  const book = {
    title: req.body.title,
    author: req.body.author,
    summary: req.body.summary,
    isbn: req.body.isbn,
    genre: req.body.genre
  }

  if (!errors.isEmpty()) {
    // 如果验证有错误
    return res.json({msg:'validation failed', errors: errors.array()})
  } else {
    // 验证没错
    Book.create(book, function(err, bookDoc) {
      // 如果保存出错
      if (err) {
        console.log(err);
        return res.json({msg: 'save failed', err})
      }
      // 如果保存没出错
      res.json({msg: 'book saved', book:bookDoc})
    })
  }
}
)

// update book
router.put('/:id', 
verifyJWT,
pre_process_form,

(req, res, next) => {
  // Extract the validation errors from a request.
  const errors = validationResult(req);

  const bookUpdateOption = {
    title: req.body.title,
    author: req.body.author,
    summary: req.body.summary,
    isbn: req.body.isbn,
    genre: req.body.genre
  }

  if (!errors.isEmpty()) {
    // 如果验证有错误
    console.log('errors:')
    console.log(errors.array())
    return res.status(400).json({msg:'validation failed', errors: errors.array()})
  } else {
    // 验证没错
    Book.findByIdAndUpdate(req.params.id, bookUpdateOption, function(err, updatedBook) {
      // 如果保存出错
      if (err) {
        console.log({msg: 'save failed', err})
        return res.status(500).send('a')
      }
      // 如果保存没出错
      return res.status(200).json({msg: 'book updated', book: updatedBook})
    })
  }
}

)

module.exports = router;

