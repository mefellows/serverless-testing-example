
/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
const { MessageProvider, Message, Matchers } = require('@pact-foundation/pact')
const { like, term } = Matchers
const path = require('path')
const { SentimentService } = require('./index')

describe('Sentiment provider tests', () => {
  const service = new SentimentService()

  const p = new MessageProvider({
    handlers: {
      'a sentiment update': (m) => service.analyseTweetSentiment(m.content)
    },
    logLevel: 'WARN',
    provider: 'AWSSummiteerSentimentSNSProvider',
    providerVersion: '1.0.0',

    // For local validation
    pactUrls: [path.resolve(process.cwd(), 'pacts', 'awssummiteersentimentsnsconsumer-awssummiteersentimentsnsprovider.json')],

    // Uncomment to use the broker
    // pactBrokerUrl: 'https://test.pact.dius.com.au/',
    // pactBrokerUsername: 'dXfltyFMgNOFZAxr8io9wJ37iUpY42M',
    // pactBrokerPassword: 'O5AIZWxelWbLvqMd8PkAVycBJh2Psyg1',
    // publishVerificationResult: true,

    // Tag the contract
    tags: ['latest'],
  })

  describe('send an event', () => {
    it('should send a valid event', () => {
      return p.verify()
    })
  })
})
