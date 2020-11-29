const crypto = require(`crypto`)
const OAuth = require(`oauth-1.0a`)
const debug = require(`debug`)(`vogel:generateAuthorization`)

module.exports = (method, url, oauthParams, params = {}) => {
  const {
    consumerKey,
    consumerSecret,
    oauthCallback,
    bearerToken,
    accessToken,
    accessTokenSecret,
    verifier,
  } = oauthParams

  if (bearerToken) {
    debug(`found bearer token, return as auth header`)

    return `Bearer ${bearerToken}`
  }

  debug(`instantiate oauth-1.0a builder`)
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

  debug(`create authorization from given oauth params and tokens`)
  const authParams = oauth.authorize({
    data: {
      oauth_callback: oauthCallback,
      oauth_verifier: verifier,
    },
    url,
    method,
  }, {
    key: accessToken,
    secret: accessTokenSecret
  })

  debug(`format oauth authorization into a header type and token`)
  const { Authorization } = oauth.toHeader(authParams)

  return Authorization
}
