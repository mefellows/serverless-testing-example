
/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
const { MessageProvider, Message, Matchers } = require('@pact-foundation/pact')
const { like, term } = Matchers
const path = require('path')
const { createEvent } = require('./index')

describe.only('Message provider tests', () => {
  const p = new MessageProvider({
    handlers: {
      'a request to save an event': () => createEvent(),
    },
    logLevel: 'WARN',
    provider: 'SNSPactEventProvider',
    providerVersion: '1.0.0',

    // For local validation
    // pactUrls: [path.resolve(process.cwd(), 'pacts', 'snspacteventconsumer-snspacteventprovider.json')],

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
