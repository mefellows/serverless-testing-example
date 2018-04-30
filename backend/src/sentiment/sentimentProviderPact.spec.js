
/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
const { MessageProvider, Message, Matchers } = require('@pact-foundation/pact')
const { like, term } = Matchers
const path = require('path')
const { SentimentService } = require('./index')
const AWS = require('aws-sdk-mock')

describe('Sentiment provider tests', () => {
  const sentiment = {
    ResultList: [{
      "SentimentScore": {
        'Positive': 0, // Modify this to watch the verification break!
        'Negative': 0,
        'Neutral': 0,
        'Mixed': "oeu"
      }
    }]
  };
  AWS.mock('IotData', 'publish', 'sent!')
  AWS.mock('Comprehend', 'batchDetectSentiment', sentiment)

  const service = new SentimentService()
  const testTweets = {
    id: 1234,
    text: 'this is a tweet',
    user: { screen_name: 'testerooney'}
  }

  const p = new MessageProvider({
    handlers: {
      'a sentiment update': (m) => service.analyseTweetSentiment(testTweets)
    },
    logLevel: 'WARN',
    provider: 'AWSSummiteerSentimentSNSProvider',
    providerVersion: '1.0.0',

    // For local validation
    // pactUrls: [path.resolve(process.cwd(), 'pacts', 'awssummiteersentimentsnsconsumer-awssummiteersentimentsnsprovider.json')],

    // Uncomment to use the broker
    pactBrokerUrl: 'https://test.pact.dius.com.au/',
    pactBrokerUsername: 'dXfltyFMgNOFZAxr8io9wJ37iUpY42M',
    pactBrokerPassword: 'O5AIZWxelWbLvqMd8PkAVycBJh2Psyg1',
    publishVerificationResult: true,

    // Tag the contract
    tags: ['latest'],
  })

  describe('send an event', () => {
    it('should send a valid event', () => {
      return p.verify()
    })
  })
})
