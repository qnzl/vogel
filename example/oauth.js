const inquire = require(`inquirer`)
const Vogel = require(`../`)

let {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_KEY_SECRET,
  TWITTER_CALLBACK,
} = process.env

let v = new Vogel({
  consumerKey: TWITTER_CONSUMER_KEY,
  consumerSecret: TWITTER_CONSUMER_KEY_SECRET
})

const getRequestToken = async () => {
 return v.getRequestToken()
}

const getAccessToken = async (requestToken, verifier) => {
  return v.getAccessToken(requestToken, verifier)
}

const prompts = [
  {
    type: `password`,
    when: Boolean(!TWITTER_CONSUMER_KEY),
    name: `consumerKey`,
    message: `What is your consumer key?`
  },
  {
    type: `password`,
    when: Boolean(!TWITTER_CONSUMER_KEY_SECRET),
    name: `consumerSecret`,
    message: `What is your consumer secret key?`
  },
  {
    type: `input`,
    when: Boolean(!TWITTER_CALLBACK),
    name: `callback`,
    message: `What is your callback URL for OAuth?`
  }
]

inquire
  .prompt(prompts)
  .then(async (answers) => {
    const {
      consumerKey = TWITTER_CONSUMER_KEY,
      consumerSecret = TWITTER_CONSUMER_KEY_SECRET,
      callback = TWITTER_CALLBACK
    } = answers

    console.log("CALL:", callback)
    v = new Vogel({
      consumerKey,
      consumerSecret,
      oauthCallback: callback
    })

    const url = await getRequestToken()

    console.log(`Go to:\n${url}`)

    const nextPrompts = [
      {
        type: `password`,
        name: `requestToken`,
        message: `What is the request token? (oauth_token)`
      },
      {
        type: `input`,
        name: `verifier`,
        message: `What is the verifier? (oauth_verifier)`
      }
    ]

    return inquire.prompt(nextPrompts)
  })
  .then(async (answers) => {
    const {
      requestToken,
      verifier
    } = answers

    const {
      token,
      tokenSecret
    } = await getAccessToken(requestToken, verifier)

    console.log(`Token:\n${token}\nToken secret:\n${tokenSecret}`)

    const res = await v.get('/1.1/statuses/home_timeline.json')

    const body = await res.json()
  })
