# Vogel

Straight-forward Twitter API client with full OAuth support (Bearer, PIN and 1.0a)

## Installation

`npm install --save vogel`

`yarn add vogel`

## Usage

If you want more in-depth and currently working examples, checkout [example/](/example).

### Starting with no access token:
```javascript
const Vogel = require('vogel')

const vogel = new Vogel({
  consumerKey: TWITTER_CONSUMER_KEY,
  consumerSecret: TWITTER_CONSUMER_SECRET,
  oauthCallback: 'http://localhost:8000/api/oauth-token'
})

const url = await vogel.getRequestToken()

// User goes to url, clicks the button, you get a request token + verifier back

// Access tokens!
// These tokens are also persisted to Vogel's scope so you don't need to send
// them with subsequent requests or manage them yourself
const {
  token,
  tokenSecret
} = await vogel.getAccessToken(requestToken, verifier)
```

---

### Have an access token already:
```javascript
const Vogel = require('vogel')

const vogel = new Vogel({
  consumerKey: TWITTER_CONSUMER_KEY,
  consumerSecret: TWITTER_CONSUMER_SECRET,
  accessTokenKey: TWITTER_ACCESS_TOKEN,
  accessTokenSecret: TWITTER_ACCESS_TOKEN_SECRET
})
```

### Bearer tokens
```javascript
const Vogel = require('vogel')

const vogel = new Vogel({
  consumerKey: TWITTER_CONSUMER_KEY,
  consumerSecret: TWITTER_CONSUMER_SECRET,
  bearerToken: TWITTER_BEARER_TOKEN
})
```

### CLI / PIN-based OAuth (oob )
```javascript
const Vogel = require('vogel')

const vogel = new Vogel({
  consumerKey: TWITTER_CONSUMER_KEY,
  consumerSecret: TWITTER_CONSUMER_SECRET,
  oauthCallback: 'oob'
})
```

## Making requests

After you have authenticated either manually (`getRequestToken() -> getAccessToken`) or through passing the token, you will be able to make any request fully authenticated

### get
```javascript
const vogel = new Vogel({ ... })

const res = await vogel.get('/1.1/statuses/home_timeline.json', {
  query: {
    count: '200'
  }
})

// Uses node-fetch under the hood
const body = await res.json()
```

### post
```javascript
const vogel = new Vogel({ ... })

// Twitter is teasing us! We want tweet editing!
const res = await vogel.post('/1.1/statuses/update.json', {
  query: {
    status: 'hello!'
  }
})

// Uses node-fetch under the hood
const body = await res.json()
```

### stream

coming soon?
