'use strict'

const AWS = require('aws-sdk')
const _ = require('lodash')

AWS.config.region = process.env.IOT_AWS_REGION
const iotData = new AWS.IotData({
  endpoint: process.env.IOT_ENDPOINT_HOST
})
const comprehend = new AWS.Comprehend({
  region: "us-east-1"
})

// Obviously, this won't persist for long in memory, but let's
// not worry about Dynamo usage here...
let sentiment = {
  'Positive': 0,
  'Negative': 0,
  'Neutral': 0,
  'Mixed': 0
}

// Consumer handler, responsible for extracting message from SNS
// and dealing with lambda-related things.
const handler = (event, context, callback) => {
  console.log("Received event from SNS")

  event.Records.forEach(e => {
    consumeEvent(JSON.parse(e.Sns.Message))
  })

  callback(null, {
    event
  })
}

// Actual consumer code, has no Lambda/AWS/Protocol specific stuff
// This is the thing we test in the Consumer Pact tests
const consumeEvent = (event) => {
  // console.log('consuming tweets', event)

  if (!event) {
    throw new Error("Invalid event, missing fields")
  }

  let params = {
    LanguageCode: 'en',
    TextList: _.map(event, (i) => i.text)
  }

  comprehend.batchDetectSentiment(params, function (err, data) {
    if (err) {
      console.dir(err, err.stack)
    } else {
      sentiment = _.reduce(data.ResultList, (acc, s) => _.mergeWith(acc, s.SentimentScore, (a, b) => a + b), sentiment)
    }

    // Sent sentiment
    params = {
      topic: 'sentiment',
      payload: JSON.stringify(sentiment),
      qos: 0
    }
    iotData.publish(params, function (err, data) {
      if (err) {
        console.log(`Unable to notify IoT of sentiment: ${err}`)
      } else {
        console.log('Successfully notified IoT of sentiment')
      }

      console.log('Sentiment:', sentiment)

      return {
        sentiment
      }
    })
  })
}


module.exports = {
  handler,
  consumeEvent
}