


const router = require('express').Router();

const User = require('../../models/user');

router.get('/', (req, res, next) => {
  return res.send('nothing')
})

router.get('/:user_name', function(req, res, next) {
  User
    .findOne({github_login: req.params.user_name}) // return null if can't find
    .exec(function(err, resultU) {
      if (err) {
        console.log(err);
        return res.json({'msg': 'find user failed'})
      }
      if (resultU) {
        return res.json({msg: `find user ${req.params.user_name} successfully`, user_detail: resultU})
      } else {
        return res.status(404).json({msg: 'no such user'})
      }
    })
})


module.exports = router;