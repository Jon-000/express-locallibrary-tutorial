const express = require('express');
const router = express.Router();
const async = require('async');

const Genre = require('../../models/genre');

router.get('/', function(req, res, next) {
  Genre
    .find()
    .exec((err, result) => {
      if (err) next (err)
      res.status(200).json({msg:"find all genres successfully", genre_list: result});
    })
});

router.delete('/:id', (req, res, next) => {
  // res.send(req.params.id)
  async.parallel(
    {
      genre: function(cb) {
        genre.findById(req.params.id).exec(cb)
      },
      genreinstance_of_genre: function(cb) {
        genreinstance
          .find({genre: req.params.id})
          .exec(cb)
      }
    },
    function(err, results) {
      if (err) return next(err);
      if (results.genre == null) {
        return res.json({msg: "no genre exist"})
      }
      if (results.genreinstance_of_genre.length === 0) {
        console.log('dsfffffffffff')
        results.genre.delete((err, genre_d) => {
          if (err) return res.json({msg: "err when delete", err});
          return res.json({msg: "delete genre successfully", genre_d})
        })
      } else {
        return res.json({
          msg: "can't delete this genre, there  are still genreinstances belong to this genre",
          genre: results.genre,
          genreinstance_of_genre: results.genreinstance_of_genre
        })
      }
    }
  )
})

router.post('/', function(req, res, next) {
  
})

module.exports = router;
