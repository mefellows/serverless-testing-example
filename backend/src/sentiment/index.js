'use strict'

const AWS = require('aws-sdk')
const _ = require('lodash')

AWS.config.region = process.env.IOT_AWS_REGION

// Port.
// Consumer handler, responsible for receiving the Lambda call
// and handling
const handler = (event, context, callback) => {
  console.log("Received event from SNS")

  SNSMessageHandler(event)
    .then(() => callback(null))
    .catch(callback)
}

// Adapter / Anti-corruption layer.
// Resonsible for extracting message from SNS and converting into domain model
// TODO: You would normally apply a schema check
//       or similar here - is the format valid etc.
const SNSMessageHandler = (event) => {
  if (!event || !event.Records) {
    return Promise.reject(new Error("No records passed in to handler"))
  }
  const service = new SentimentService()
  const sentiments = _.map(event.Records, (e) => {
    service
      .analyseTweetSentiment(JSON.parse(e.Sns.Message))
      .then(() => service.publishSentiment())
  })

  return Promise.all(sentiments)
}

// Actual consumer code, has no Lambda/AWS/Protocol specific stuff
// This is the thing we test in the Consumer Pact tests
class SentimentService {
  constructor(analyser, repository) {
    this.analyser = analyser || new SentimentAnalyser()
    this.repository = repository || new SentimentRepository()
    this.sentiment = {}
  }

  analyseTweetSentiment(tweets) {
    console.log('analysing tweet sentiment!')

    if (!tweets) {
      throw new Error("Invalid request, missing fields")
    }

    return this.analyser
      .detectSentiment(_.map(tweets, (i) => i.text))
      .then((sentiment) => {
        this.sentiment = sentiment

        return this.sentiment
      })
  }

  publishSentiment() {
    return this.repository.save(this.sentiment)
  }
}

class SentimentAnalyser {
  constructor() {
    // Obviously, this won't persist for long in memory, but let's
    // not worry about Dynamo usage here...
    this.sentiment = {
      'Positive': 0,
      'Negative': 0,
      'Neutral': 0,
      'Mixed': 0
    }

     this.comprehend = new AWS.Comprehend({
      region: "us-east-1"
    })
  }

  detectSentiment(phrases) {
    let params = {
      LanguageCode: 'en',
      TextList: phrases
    }
    return this.comprehend
      .batchDetectSentiment(params).promise()
      .then((data) => {
        this.sentiment = _.reduce(data.ResultList, (acc, s) => _.mergeWith(acc, s.SentimentScore, (a, b) => a + b), this.sentiment)

        return this.sentiment
      })
  }
}
class SentimentRepository {
  constructor() {
    this.iotData = new AWS.IotData({
      endpoint: process.env.IOT_ENDPOINT_HOST
    })
  }
  save(sentiment) {
    return this.iotData.publish({
      topic: 'sentiment',
      payload: JSON.stringify(sentiment),
      qos: 0
    })
    .promise()
  }
}

module.exports = {
  handler,
  SentimentAnalyser,
  SentimentService,
  SentimentRepository
}