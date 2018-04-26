
/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
const { handler } = require('./index')
const { fail } = require( 'assert');
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
const AWS = require('aws-sdk-mock')

chai.use(chaiAsPromised)

describe.only("Sentiment - Lambda function", () => {
  context("#handler", () => {
    const sentiment = {
      ResultList: [{
        "SentimentScore": {
          'Positive': 0,
          'Negative': 0,
          'Neutral': 0,
          'Mixed': 0
        }
      }]
    };
    AWS.mock('IotData', 'publish', 'sent!')
    AWS.mock('Comprehend', 'batchDetectSentiment', sentiment)
    const event = require('./data/sns.json')

    describe('when we get an invalid event', () => {
      it('should throw and error', () => {
        expect(() => {
          handler(null)
        }).to.throw(Error, "No records passed in to handler")
      })
    })

    describe('when we get a valid event', () => {
      it('should execute the lambda successfully', (done) => {
        const callback = (e, b) => {
          if (e) done(new Error("Expected callback without error"))
          else done()
        }
        handler(event, null, callback)
      })
    })
  })
})