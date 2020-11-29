const inquire = require(`inquirer`)
const Vogel = require(`../`)

let {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_KEY_SECRET,
} = process.env

let v = new Vogel({
  consumerKey: TWITTER_CONSUMER_KEY,
  consumerSecret: TWITTER_CONSUMER_KEY_SECRET,
  oauthCallback: `oob`
})

const getRequestToken = async () => {
  return v.getRequestToken()
}

const getAccessToken = async (verifier) => {
  // We have a parameter overload where if you only send one parameter,
  // it assumes you are only sending the verifier
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
      consumerKey = TWITTER_CONSUMER_KEY,
      consumerKeySecret = TWITTER_CONSUMER_KEY_SECRET
    } = answers

    v = new Vogel({
      consumerKey,
      consumerSecret,
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
      accessToken,
      accessTokenSecret
    } = await getAccessToken(verifier)

    console.log(`Token:\n${accessToken}\nToken secret:\n${accessTokenSecret}`)
  })

