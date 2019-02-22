
const router = require('express').Router()
const https = require('https')
const querystring = require('querystring')
const axios = require('axios')

const url_for_get_access_token = 'https://github.com/login/oauth/access_token'
// const url = new URL(url_for_get_access_token)

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

      // 更新数据库中的用户信息
      
      return res.json({
        msg: 'get access_token and user profile successfully',
        oauthResult: resA.data,
        githubUserProfile: resUser.data
      })
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
  // exchange `code` for an `access token`  


})

module.exports = router