const generateAuthorization = require(`./_generateAuthorization`)
const fetch = require(`node-fetch`)
const debug = require(`debug`)(`vogel:index`)

const $generateAuthorization = Symbol(`generateAuthorization`)
const $parseFormResponse = Symbol(`parseFormResponse`)
const $request = Symbol(`request`)

const TWITTER_API = `https://api.twitter.com`

class Vogel {
  constructor(opts) {
    debug(`constructing new instance of Vogel`)

    const {
      bearerToken,
      oauthConsumerKey,
      oauthConsumerSecret,
      accessTokenKey,
      accessTokenSecret,
      twitterApiVersion,
      oauthCallback
    } = opts

    this.twitterApiVersion = twitterApiVersion || `1.1`

    this.oauthParams = {
      token: accessTokenKey,
      bearerToken,
      tokenSecret: accessTokenSecret,
      callback: oauthCallback,
      consumerKey: oauthConsumerKey,
      consumerSecret: oauthConsumerSecret
    }
  }

  [$parseFormResponse](string) {
    const params = string.split(`&`)

    return params.reduce((map, param) => {
      let [ key, value ] = param.split(`=`)

      map[key] = value

      return map
    }, {})

  }

  [$generateAuthorization](method, url, params) {
    debug(`generating authorization header`)

    return generateAuthorization(method, url, this.oauthParams, params)
  }

  async [$request](method, url, contentType, req = {}) {
    debug(`creating request ${method} ${url}`)

    const {
      query,
      body
    } = req

    const fullUrl = `${TWITTER_API}${url}`

    debug(`constructing mega object of all url parameters`)
    const requestParams = {
      ...query,
      ...body
    }

    const authHeaderValue = this[$generateAuthorization](method, fullUrl, requestParams)

    debug(`executing request ${method} ${url}`)

    let queryString = ``

    if (query) {
      const queryStringArr = Object.keys(query).reduce((arr, key) => {
        const value = query[key]

        const str = `${key}=${value}`

        arr.push(str)
      }, [])

      queryString = queryStringArr.join(`&`)
    }

    debug(`calling ${fullUrl} with query string ${queryString}`)

    return fetch(`${fullUrl}`, {
        method,
        body: JSON.stringify(body),
        headers: {
          [`Content-Type`]: contentType || `application/x-www-form-urlencoded`,
          [`Authorization`]: authHeaderValue
        }
      })
  }

  async getRequestToken() {
    if (!this.oauthParams.callback) {
      throw new Error(`To authenticate, you need to pass \`oauthCallback\` to the constructor`)
    }

    debug(`creating initial authentication request for a request token`)
    const res = await this.post(`/oauth/request_token`)

    if (res.status !== 200) {
      const error = await res.text()

      throw new Error(`Unsuccessful OAuth authorization due to ${error}`)
    }

    const body = await res.text()

    const {
      oauth_token_secret,
      oauth_token,
      oauth_callback_confirmed
    } = this[$parseFormResponse](body)

    // Kill me.
    if (oauth_callback_confirmed === `false`) {
      throw new Error(`Initial authorization declined your callback (${this.oauthParams.callback}). Check your Twitter API dashboard.`)
    }

    this.oauthParams.tokenSecret = oauth_token_secret
    this.oauthParams.token = oauth_token

    return `${TWITTER_API}/oauth/authorize?oauth_token=${oauth_token}`
  }

  async getAccessToken(requestToken, verifier) {
    if (!verifier) {
      verifier = requestToken
      requestToken = this.oauthParams.token
    }

    this.oauthParams.token = requestToken
    this.oauthParams.verifier = verifier

    const res = await this.post(`/oauth/access_token`)

    if (res.status !== 200) {
      const error = await res.text()

      throw new Error(`Unsuccessful OAuth request token exchange due to ${error}`)
    }

    const body = await res.text()

    const {
      oauth_token,
      oauth_token_secret,
      user_id,
      screen_name
    } = this[$parseFormResponse](body)

    this.oauthParams.token = oauth_token
    this.oauthParams.tokenSecret = oauth_token_secret
    this.oauthParams.callback = null
    this.oauthParams.verifier = null

    this.activeUser = {
      id: user_id,
      screenName: screen_name
    }

    return {
      token: oauth_token,
      tokenSecret: oauth_token_secret
    }
  }

  async get(url, opts) {
    return this[$request](`GET`, url, {
      query: opts.query || {}
    })
  }

  async post(url, opts = {}) {
    return this[$request](`POST`, url, {
      query: opts.query || {},
      body: opts.body || {}
    })
  }

  stream() {
    throw new Error(`tbd`)
  }
}

module.exports = Vogel
