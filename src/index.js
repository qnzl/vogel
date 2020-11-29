const generateAuthorization = require(`./_generateAuthorization`)
const fetch = require(`node-fetch`)
const debug = require(`debug`)(`vogel:index`)

/**
 * @typedef FetchResponse
 * @property {Promise<string>} text
 * @property {Promise<object>} json
 * @property {number} status
 */

const $generateAuthorization = Symbol(`generateAuthorization`)
const $parseFormResponse = Symbol(`parseFormResponse`)
const $request = Symbol(`request`)

const TWITTER_API = `https://api.twitter.com`

/**
 * Vogel is the overall class, everything you'll need (hopefully) is in it.
 *
 * @class
 * @constructor
 * @public
 */
class Vogel {
  /**
   * @constructor
   *
   * @param {object} opts
   * @param {string} [opts.bearerToken]
   * @param {string} [opts.consumerKey]
   * @param {string} [opts.consumerSecret]
   * @param {string} [opts.accessToken]
   * @param {string} [opts.accessTokenSecret]
   * @param {string} [opts.oauthCallback]
   */
  constructor(opts) {
    debug(`constructing new instance of Vogel`)

    const {
      bearerToken,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret,
      oauthCallback
    } = opts

    this.oauthParams = {
      accessToken,
      bearerToken,
      accessTokenSecret,
      oauthCallback,
      consumerKey,
      consumerSecret
    }
  }

  // Helper function to parse form encoded responses
  [$parseFormResponse](string) {
    debug(`parsing form response`)

    const params = string.split(`&`)

    debug(`got ${params.length} params from string`)

    return params.reduce((map, param) => {
      let [ key, value ] = param.split(`=`)

      map[key] = value

      return map
    }, {})

  }

  // Silly wrapper to generate an authorization header
  // It will either end up being "Bearer <bearer token>" or "OAuth <bunch of stuff>"
  [$generateAuthorization](method, url, params) {
    debug(`generating authorization header`)

    return generateAuthorization(method, url, this.oauthParams, params)
  }

  // Internal request method, to add query string and a signed Authorization token
  async [$request](method, url, contentType, req = {}) {
    debug(`creating request ${method} ${url}`)

    // Allow (method, url, req)
    if (typeof contentType !== `string`) {
      req = contentType
      contentType = null
    }

    const {
      query,
      body
    } = req

    debug(`constructing mega object of all url parameters`)
    const requestParams = {
      ...query,
      ...body
    }

    const fullUrl = `${TWITTER_API}${url}`

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

  /**
   * First step of OAuth authentication, request a request token to exchange for an access token
   *
   * @returns {string} url - URL for a user to follow to authenticate to the app
   */
  async getRequestToken() {
    if (!this.oauthParams.oauthCallback) {
      throw new Error(`To authenticate, you need to pass \`oauthCallback\` to the constructor`)
    }

    debug(`creating initial authentication request for a request token`)
    const res = await this.post(`/oauth/request_token`)

    if (res.status !== 200) {
      const error = await res.text()

      throw new Error(`Unsuccessful OAuth authorization due to ${error}`)
    }

    const body = await res.text()

    // Can't convince Twitter's API to send JSON so we have to
    // parse the string.
    const {
      oauth_token_secret,
      oauth_token,
      oauth_callback_confirmed
    } = this[$parseFormResponse](body)

    // Kill me.
    if (oauth_callback_confirmed === `false`) {
      throw new Error(`Initial authorization declined your callback (${this.oauthParams.callback}). Check your Twitter API dashboard.`)
    }

    // Set token and tokenSecret to short-lived tokens (request tokens)
    this.oauthParams.accessToken = oauth_token
    this.oauthParams.accessTokenSecret = oauth_token_secret

    // Return URL that the user should go to to authenticate
    return `${TWITTER_API}/oauth/authorize?oauth_token=${oauth_token}`
  }

  /**
   * Exchange short-lived request token and verifier for a long-lived access token
   *
   * @param {string} [requestToken] - request token retrieved from callback
   * @param {string} [verifier] - verifier retrieved from callback or PIN when using oauthCallback = 'oob'
   *
   * @returns {object} tokens
   * @returns {string} tokens.token - Access token
   * @returns {string} tokens.tokenSecret - Access token secret
   */
  async getAccessToken(requestToken, verifier) {
    // Allow 'oob' callbacks to only send `verifier`
    if (!verifier) {
      verifier = requestToken
      requestToken = this.oauthParams.token
    }

    this.oauthParams.accessToken = requestToken
    this.oauthParams.verifier = verifier

    const res = await this.post(`/oauth/access_token`)

    if (res.status !== 200) {
      const error = await res.text()

      throw new Error(`Unsuccessful OAuth request token exchange due to ${error}`)
    }

    const body = await res.text()

    // Can't convince Twitter's API to send JSON so we have to
    // parse the string.
    const {
      oauth_token,
      oauth_token_secret,
      user_id,
      screen_name
    } = this[$parseFormResponse](body)

    // Set token and tokenSecret to long-living tokens (access tokens)
    this.oauthParams.accessToken = oauth_token
    this.oauthParams.accessTokenSecret = oauth_token_secret
    this.oauthParams.oauthCallback = null
    this.oauthParams.verifier = null

    // Not super useful but meh, we have the info.
    this.activeUser = {
      id: user_id,
      screenName: screen_name
    }

    return {
      token: oauth_token,
      tokenSecret: oauth_token_secret
    }
  }

  /**
   * Make a GET request to Twitter's API
   *
   * @param {string} url - URL of Twitter endpoint
   * @param {object} [req]
   * @param {object} [req.query] Query parameters
   *
   * @returns {Promise<FetchResponse>} promisified response from node-fetch
   */
  async get(url, req = {}) {
    return this[$request](`GET`, url, req)
  }

  /**
   * Make a POST request to Twitter's API
   *
   * @param {string} url URL of Twitter endpoint
   * @param {object} [req]
   * @param {object} [req.query] - Query parameters
   * @param {object} [req.body] - JSON body
   *
   * @returns {Promise<FetchResponse>} promisified response from node-fetch
   */
  async post(url, req = {}) {
    return this[$request](`POST`, url, req)
  }

  stream() {
    throw new Error(`tbd`)
  }
}

module.exports = Vogel
