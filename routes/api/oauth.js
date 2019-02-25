
const fs = require('fs')
const path = require('path')
const router = require('express').Router()
const https = require('https')
const querystring = require('querystring')
const axios = require('axios')

const jwt = require('jsonwebtoken')
const privateKey = fs.readFileSync(path.join(__dirname, '../../jwtRS256.key'))


const User = require('../../models/user');

const url_for_get_access_token = 'https://github.com/login/oauth/access_token'
// const url = new URL(url_for_get_access_token)

// 该路由是为了响应oauth的redirect路径
// 该路由需为github oauth app设定的redirec_url的子路由,或者说下级路由
// 此时github设置为`http://localhost:8080/api/oauth/github`
// 参考https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/#redirect-urls
router.get('/github/callback', (req, res, next) => {
  let c = req.query.code

  // prepare data
  const client_id = process.env.GITHUB_OAUTH_CLIENT_ID
  const client_secret = process.env.GITHUB_OAUTH_CLIENT_SECRET
  const code = c
  console.log(code)
  
  // const postData = querystring.stringify({
  //   'client_id': client_id,
  //   'client_secret': client_secret,
  //   'code': code,
  // })

try {
  axios({
    method: 'post',
    headers: {'Accept': 'application/json'},
    url: url_for_get_access_token,
    data: {
        client_id,
        client_secret,
        code,
      }
  })
  .then(resA => {
    // 得到`access token`
    console.log(resA.data)
    const { access_token } = resA.data

    // 应该先检查用户对scope的授权情况
    // todo

    // 利用`access_token`获取用户数据
    axios({
      method: 'get',
      url: `https://api.github.com/user`,
      headers: {"Authorization": `token ${access_token}`}
    }).then(resUser => {
      // 获取用户成功
      const githubUserInfo = {
        github_login: resUser.data.login,
        github_id: resUser.data.id,
        github_node_id: resUser.data.node_id,
        github_avatar_url: resUser.data.avatar_url,
        github_email: resUser.data.email,
        github_name: resUser.data.name,
      }
      // 更新数据库中的用户信息
      User
        .findOne({
          github_login: githubUserInfo.github_login,
          github_id: githubUserInfo.github_id,
          github_email: githubUserInfo.github_email
        })
        .exec((err, userDoc) => {
          console.log(userDoc)
          if (err) return res.json({msg: 'find user failed'})
          // 检查用户是否存在,没查到返回null
          if (userDoc) {
            // 如果已有用户.返回jwt
            // 先异步创建一个jwt
            jwt.sign(
              // payload
              {
                iss: "http://yisi.fun",
                aud: "http://yisi.fun/api",
                sub: githubUserInfo.github_login,
                exp: Math.floor( ( Date.now() + 7*24*60*60*1000 ) / 1000 ), // jwt对exp字段的要求为单位seconds的数字,js中为milliseconds
                scope: "read write",
                foo: "bar",
              },
              privateKey,
              // options
              { 
                header: {
                  alg: 'RS256',
                  typ: 'JWT'
                }
              },
              function(err, jwtToken) {
                // 生成jwt失败
                if (err) return res.json({msg: 'generate jwt failed'})
                // 生成jwt成功
                // 将jwt存入cookie然后重定向至'/login'
                console.log(req.cookies)
                res.cookie('jwt_token', jwtToken)
                res.redirect(302, req.cookies.url_before_oauth)
              }
            )

          } else {
            // 没有用户
            // 新建用户,成功后返回jwt
            User
              .create(githubUserInfo)
              .then((createdUser) => {
                // generate jwt
                jwt.sign(
                  // payload
                  {
                    iss: "http://yisi.fun",
                    aud: "http://yisi.fun/api",
                    sub: createdUser.github_login,
                    exp: Math.floor( ( Date.now() + 7*24*60*60*1000 ) / 1000 ), // jwt对exp字段的要求为单位seconds的数字,js中为milliseconds
                    scope: "read write",
                    foo: "bar",
                  },
                  privateKey,
                  // options
                  { 
                    header: {
                      alg: 'RS256',
                      typ: 'JWT'
                    }
                  },
                  function(err, token) {
                    // 生成jwt失败
                    if (err) return res.json({msg: 'generate jwt failed'})
                    // 生成jwt成功
                    return res.redirect('/')
                  }
                )
              })
              .catch((createUserErr) => {
                console.log(createUserErr)
                res.json({msg: 'create user failed'})
              })
          }
        })
      
      
      // return res.json({
      //   msg: 'get access_token and user profile successfully',
      //   oauthResult: resA.data,
      //   githubUserProfile: resUser.data
      // })
    }).catch((err) => {
      // 先判断错误类型.因为上游程序的错误和500的http错误都会到这里!但是应该区别对待
      if (err.response) {
        // 成功发送了请求,并且服务器端返回的状态码不是2xx
        // 即收到响应但失败,即成功发送请求,但服务器没有给出用户信息
        console.log('get user profile from github failed')
        console.log(err.response.data);
        console.log(err.response.status);
        console.log(err.response.headers); 
        return res.json({msg: 'get user profile from github failed, reject from github'})
      } else if (err.request) {
        // 成功发送了请求,但没收到响应
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(err.request)
        return res.json({msg: 'get user profile from github failed, can not connect to github'})
      } else {
        // 请求没发送成功就出错了
        console.log(`Error`, err.message)
        return res.json({msg: 'get user profile from github failed, an internal error occurred.'})
      }
      // 额外的疑问?如何处理catch中出现的错误?
    })
  })
  .catch(err => console.error(err))
} catch (error) {
  console.log(error)
}




})

module.exports = router