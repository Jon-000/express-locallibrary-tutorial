
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');



const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

const async = require('async');

exports.index = async function(req, res) {   
    
  // 方法一
  // Promise.all([
  //   p1(),
  //   BookInstance.countDocuments({}),
  //   BookInstance.countDocuments({status:'Available'}),
  //   Author.countDocuments({}),
  //   Genre.countDocuments({})
  // ]).then((resultArray) => {
  //   const results = {
  //     book_count: resultArray[0],
  //     book_instance_count: resultArray[1],
  //     book_instance_available_count: resultArray[2],
  //     author_count: resultArray[3],
  //     genre_count: resultArray[4],
  //   }    
  //   res.render('index', {title: 'hooooome', data: results})
  // }).catch(err =>{
  //   console.log(err)
  //   res.render('index', {title: 'hooooome', error: err})
  // })

  // 方法一变种一
  // const [book_count, book_instance_count, book_instance_available_count, author_count, genre_count] = await Promise.all([
  //   Book.countDocuments({}),
  //   BookInstance.countDocuments({}),
  //   BookInstance.countDocuments({status:'Available'}),
  //   Author.countDocuments({}),
  //   Genre.countDocuments({})
  // ])
  // res.render('index', {title: 'hooooome', data: {book_count, book_instance_count, book_instance_available_count, author_count, genre_count}})

  // 方法一变种二
  // 参考如下两行代码，和上边的变种一进行改造
  // const results = await Promise.all(promises.map(p => p.catch(e => e)));
  // const validResults = results.filter(result => !(result instanceof Error));
  // 这里不加`.exec()`也行，不过返回的不是promise，是«Query»，query形式上支持.then或async/await
  const promiseArray = [
    Book.countDocuments({}).exec(), // 可尝试将次行换为`p1（）`来抛出错误测试代码
    BookInstance.countDocuments({}).exec(),
    BookInstance.countDocuments({status:'Available'}).exec(),
    Author.countDocuments({}).exec(),
    Genre.countDocuments({}).exec()
  ]
  const results = await Promise.all(promiseArray.map(p => p.catch(e => e)));
  const validResults = results.map(result => !(result instanceof Error) ? result : null);
  const [book_count, book_instance_count, book_instance_available_count, author_count, genre_count] = validResults;
  res.render('index', {title: 'hooooome', data: {book_count, book_instance_count, book_instance_available_count, author_count, genre_count}})


  // 方法二
  // const r = await getCountParallel()
  // console.log(r)

    // 方法三
    // async.parallel({
    //     book_count: function(callback) {
    //         Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
    //     },
    //     book_instance_count: function(callback) {
    //         BookInstance.countDocuments({}, callback);
    //     },
    //     book_instance_available_count: function(callback) {
    //         BookInstance.countDocuments({status:'Available'}, callback);
    //     },
    //     author_count: function(callback) {
    //         Author.countDocuments({}, callback);
    //     },
    //     genre_count: function(callback) {
    //         Genre.countDocuments({}, callback);
    //     }
    // }, function(err, results) {
    //     res.render('index', { title: 'Local Library Home', error: err, data: results });
    // });

    // 方法四
    // 思路如下
    // (async function parallel() {

    //   // step 1 - initiate all promises
    //   let task1 = wait(2000, 'parallelTask1');
    //   let task2 = wait(500, 'parallelTask2');
    
    //   // step 2 - await all promises
    //   task1 = await task1
    //   task2 = await task2
    
    //   // step 3 - all results are 100% ready
    //   console.log(task1, task2)
    // })()
};

exports.book_list = (req, res, next) => {
  Book.find({}, 'title author')
  .populate('author')
  .exec((err, list_books) => {
    if (err) return next(err);
    res.render('book_list',
      { title: "Book LISt", book_list: list_books }
      )
  })


}

exports.book_detail = (req, res, next) => {

  async.parallel({
    book: function(cb) {
      Book.findById(req.params.id)
        .populate('author')
        .populate('genre')
        .exec(cb)
    },
    book_instance: function(cb) {
      BookInstance.find({'book': req.params.id})
      .exec(cb);
    },
  },
    function(err, results) {
      if (err) return next(err);
      if (results.book==null) {
        const err = new Error("Book not found");
        err.status = 404;
        return next(err);
      }
      res.render('book_detail', { title: 'Title', book: results.book, book_instances: results.book_instance } );
    } 
  )
}

// Display book create form on GET.
exports.book_create_get = function(req, res, next) { 
      
  // Get all authors and genres, which we can use for adding to our book.
  async.parallel({
      authors: function(callback) {
          Author.find(callback);
      },
      genres: function(callback) {
          Genre.find(callback);
      },
  }, function(err, results) {
      if (err) { return next(err); }
      res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres });
  });
  
};

// Handle book create on POST.
exports.book_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
      if(!(req.body.genre instanceof Array)){
          if(typeof req.body.genre==='undefined')
          req.body.genre=[];
          else
          req.body.genre=new Array(req.body.genre);
      }
      next();
  },

  // Validate fields.
  body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
  body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
  body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
  body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

  // Sanitize fields (using wildcard).
  sanitizeBody('*').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
      
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a Book object with escaped and trimmed data.
      var book = new Book(
        { title: req.body.title,
          author: req.body.author,
          summary: req.body.summary,
          isbn: req.body.isbn,
          genre: req.body.genre
         });

      if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/error messages.

          // Get all authors and genres for form.
          async.parallel({
              authors: function(callback) {
                  Author.find(callback);
              },
              genres: function(callback) {
                  Genre.find(callback);
              },
          }, function(err, results) {
              if (err) { return next(err); }

              // Mark our selected genres as checked.
              for (let i = 0; i < results.genres.length; i++) {
                  if (book.genre.indexOf(results.genres[i]._id) > -1) {
                      results.genres[i].checked='true';
                  }
              }
              res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
          });
          return;
      }
      else {
          // Data from form is valid. Save book.
          book.save(function (err) {
              if (err) { return next(err); }
                 //successful - redirect to new book record.
                 res.redirect(book.url);
              });
      }
  }
];

exports.book_delete_get = (req, res) => {}

exports.book_delete_post = (req, res) => {}

// Display book update form on GET.
exports.book_update_get = function(req, res, next) {

  // Get book, authors and genres for form.
  async.parallel({
      book: function(callback) {
          Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
      },
      authors: function(callback) {
          Author.find(callback);
      },
      genres: function(callback) {
          Genre.find(callback);
      },
      }, function(err, results) {
          if (err) { return next(err); }
          if (results.book==null) { // No results.
              var err = new Error('Book not found');
              err.status = 404;
              return next(err);
          }
          // Success.
          // Mark our selected genres as checked.
          for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
              for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                  if (results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
                      results.genres[all_g_iter].checked='true';
                  }
              }
          }
          res.render('book_form', { title: 'Update Book', authors:results.authors, genres:results.genres, book: results.book });
      });

};

// Handle book update on POST.
exports.book_update_post = [

  // Convert the genre to an array
  (req, res, next) => {
      if(!(req.body.genre instanceof Array)){
          if(typeof req.body.genre==='undefined')
          req.body.genre=[];
          else
          req.body.genre=new Array(req.body.genre);
      }
      next();
  },
 
  // Validate fields.
  body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
  body('author', 'Author must not be empty.').isLength({ min: 1 }).trim(),
  body('summary', 'Summary must not be empty.').isLength({ min: 1 }).trim(),
  body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

  // Sanitize fields.
  sanitizeBody('title').trim().escape(),
  sanitizeBody('author').trim().escape(),
  sanitizeBody('summary').trim().escape(),
  sanitizeBody('isbn').trim().escape(),
  sanitizeBody('genre.*').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a Book object with escaped/trimmed data and old id.
      var book = new Book(
        { title: req.body.title,
          author: req.body.author,
          summary: req.body.summary,
          isbn: req.body.isbn,
          genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
          _id:req.params.id //This is required, or a new ID will be assigned!
         });

      if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/error messages.

          // Get all authors and genres for form.
          async.parallel({
              authors: function(callback) {
                  Author.find(callback);
              },
              genres: function(callback) {
                  Genre.find(callback);
              },
          }, function(err, results) {
              if (err) { return next(err); }

              // Mark our selected genres as checked.
              for (let i = 0; i < results.genres.length; i++) {
                  if (book.genre.indexOf(results.genres[i]._id) > -1) {
                      results.genres[i].checked='true';
                  }
              }
              res.render('book_form', { title: 'Update Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
          });
          return;
      }
      else {
          // Data from form is valid. Update the record.
          Book.findByIdAndUpdate(req.params.id, book, {}, function (err,thebook) {
              if (err) { return next(err); }
                 // Successful - redirect to book detail page.
                 res.redirect(thebook.url);
              });
      }
  }
];


async function getCountParallel() {
  const book_count = await Book.countDocuments({})
  const book_instance_count = await BookInstance.countDocuments({})
  const book_instance_available_count =await BookInstance.countDocuments({status:'Available'})
  const author_count =await Author.countDocuments({})
  const genre_count =await Genre.countDocuments({})
  return {
    book_count,
    book_instance_count,
    book_instance_available_count,
    author_count,
    genre_count,
  }
}

const p1 = () => new Promise((resolve, reject) => {
  setTimeout(() => {
    reject(new Error("errjfklsajfklsda;jfklasjfk"))
  }, 1000);
})