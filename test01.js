
const https = require('https')
const querystring = require('querystring')

const base_url_for_get_access_token = 'https://github.com/login/oauth/access_token'
const url = new URL(base_url_for_get_access_token)

const test = () => {
  let c = `f34c7054b9d516a3c9d6`

  // exchange `code` for an `access token`
  // prepare data
  const client_id = `507ab5ba87361d2cb13a`
  const client_secret = `145506820218c8dd786f6f61eeab2e1172586e5f`
  const code = c
  
  const postData = querystring.stringify({
    'client_id': client_id,
    'client_secret': client_secret,
    'code': code,
  })

  console.log(url.hostname)
  console.log(url.pathname)
  console.log(postData)
  const req_access_token = https.request(
    {
      protocol: 'https:',
      hostnmae: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      }
    },
    (resM) => {
      console.log(
        resM.statusCode
      )
      resM.setEncoding('utf8')
      resM.on('data', console.log('data incoming'))
      resM.on('end', () => console.log('no more data'))
    }
  )
  req_access_token.on('error', (e) => {
    console.error(`problem with request: ${e.message}`)
  });

  req_access_token.write(postData);
  req_access_token.end();
}

test();