const inquire = require(`inquirer`)
const Vogel = require(`../`)

let {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_KEY_SECRET,
  TWITTER_CALLBACK,
} = process.env

let v = new Vogel({
  oauthConsumerKey: TWITTER_CONSUMER_KEY,
  oauthConsumerSecret: TWITTER_CONSUMER_KEY_SECRET
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
    name: `consumerKeySecret`,
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
      consumerKey,
      consumerKeySecret,
      callback
    } = answers

    TWITTER_CONSUMER_KEY = TWITTER_CONSUMER_KEY || consumerKey
    TWITTER_CONSUMER_KEY_SECRET = TWITTER_CONSUMER_KEY_SECRET || consumerKeySecret
    TWITTER_CALLBACK = TWITTER_CALLBACK || callback

    v = new Vogel({
      oauthConsumerKey: TWITTER_CONSUMER_KEY,
      oauthConsumerSecret: TWITTER_CONSUMER_KEY_SECRET
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
  })
