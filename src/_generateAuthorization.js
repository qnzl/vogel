const crypto = require(`crypto`)
const OAuth = require(`oauth-1.0a`)
const debug = require(`debug`)(`vogel:generateAuthorization`)

// https://developer.twitter.com/en/docs/authentication/oauth-1-0a/creating-a-signature
module.exports = (method, url, oauthParams, params = {}) => {
  const {
    consumerKey,
    consumerSecret,
    callback,
    bearerToken,
    token,
    tokenSecret,
    nonce,
    verifier,
    version = '1.0'
  } = oauthParams

  if (bearerToken) {
    debug(`found bearer token, return as auth header`)

    return `Bearer ${bearerToken}`
  }

  const oauth = OAuth({
    consumer: {
      key: consumerKey,
      secret: consumerSecret,
    },
    signature_method: `HMAC-SHA1`,
    hash_function(baseString, key) {
      return crypto
        .createHmac('sha1', key)
        .update(baseString)
        .digest('base64')
    }
  })

  const authParams = oauth.authorize({
    data: {
      oauth_callback: callback,
      oauth_verifier: verifier,
    },
    url,
    method,
  }, {
    key: token,
    secret: tokenSecret
  })

  const { Authorization } = oauth.toHeader(authParams)

  return Authorization
}
