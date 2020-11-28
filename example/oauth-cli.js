const inquire = require(`inquirer`)
const Vogel = require(`../`)

let {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_KEY_SECRET,
} = process.env

let v = new Vogel({
  oauthConsumerKey: TWITTER_CONSUMER_KEY,
  oauthConsumerSecret: TWITTER_CONSUMER_KEY_SECRET,
  oauthCallback: `oob`
})

const getRequestToken = async () => {
  return v.getRequestToken()
}

const getAccessToken = async (verifier) => {
  return v.getAccessToken(verifier)
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
  }
]

inquire
  .prompt(prompts)
  .then(async (answers) => {
    const {
      consumerKey,
      consumerKeySecret
    } = answers

    TWITTER_CONSUMER_KEY = TWITTER_CONSUMER_KEY || consumerKey
    TWITTER_CONSUMER_KEY_SECRET = TWITTER_CONSUMER_KEY_SECRET || consumerKeySecret

    v = new Vogel({
      oauthConsumerKey: TWITTER_CONSUMER_KEY,
      oauthConsumerSecret: TWITTER_CONSUMER_KEY_SECRET,
      oauthCallback: `oob`
    })

    const url = await getRequestToken()

    console.log(`Go to:\n${url}`)

    const nextPrompts = [
      {
        type: `input`,
        name: `verifier`,
        message: `What is the PIN?`
      }
    ]

    return inquire.prompt(nextPrompts)
  })
  .then(async (answers) => {
    const {
      verifier
    } = answers

    const {
      token,
      tokenSecret
    } = await getAccessToken(verifier)

    console.log(`Token:\n${token}\nToken secret:\n${tokenSecret}\n`)
  })

