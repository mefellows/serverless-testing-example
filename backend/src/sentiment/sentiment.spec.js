
/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
const { handler } = require('./index')
const { fail } = require( 'assert')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
const AWS = require('aws-sdk-mock')

chai.use(chaiAsPromised)

const createCallback = (done) => (e) => (e) ? done(e) : done()

describe("Sentiment - Lambda function", () => {
  context("#handler", () => {
    // 1. Mock out SDK calls with `aws-sdk-mock`
    const sentiment = {
      ResultList: [{
        "SentimentScore": {
          'Positive': 0,
          'Negative': 0,
          'Neutral': 0,
          'Mixed': 0
        }
      }]
    }
    AWS.mock('IotData', 'publish', 'sent!')
    AWS.mock('Comprehend', 'batchDetectSentiment', sentiment)

    // 2. Test Handler interface with different events

    describe('when we get an invalid event', () => {
      it('should throw an error', () => {
        expect(() => {
          handler(null)
        }).to.throw(Error, "No records passed in to handler")
      })
    })

    describe('when we get an event from an unknown source', () => {
      it('should throw an error', done => {
        const event = require('./data/sns-unknown.json')
        handler(event, null, (e) => {
          expect(e.message).to.eql("Unrecognised event type: \"undefined\"")
          done()
        })
      })
    })

    describe("when we get a lambda event", () => {
      describe("with an SNS message containing a tweet", () => {
        it("should execute the lambda successfully", done => {
          const event = require('./data/sns.json')
          const callback = (done) => (e) => (e) ? done(e) : done()
          handler(event, null, callback)
        })
      })
    })
  })
})
