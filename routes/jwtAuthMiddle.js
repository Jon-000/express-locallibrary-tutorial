
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')


const cert = fs.readFileSync(path.join(__dirname, '../jwtRS256.key.pub'));  // get public key

module.exports = function verifyJWT(req, res, next) {
  // 从请求的header中拿到jwt_token
  const jwt_token = req.headers['authorization'].split(' ')[1]
  // console.log(jwt_token)
  if (jwt_token) {
    // 如果有token,则进行验证
    jwt.verify(jwt_token, cert, function(err, decoded) {
      if (!err & decoded !== undefined) {
        // 如果没错误并且token成功解析,那么允许通过
        return next()
      } else {
        if (err) {console.log(err)}
        return res.status(403).json({msg:'wrong token'})
      }
      // console.log(decoded.foo) // bar
    });
  } else {
    // 无token,bad request
    res.status(400).json({msg: '请求应携带jwt_token'})
  }

  
}
