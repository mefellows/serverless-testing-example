'use strict'

const Twit = require('twit')
const AWS = require('aws-sdk')
const dynamodb = new AWS.DynamoDB({
  endpoint: process.env.DYNAMO_ENDPOINT_HOST
})
const sns = new AWS.SNS({
  endpoint: process.env.SNS_ENDPOINT_HOST
})
const t = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
})
const TOPIC_ARN = process.env.TOPIC_ARN
const MAGIC_KEYWORD = process.env.MAGIC_KEYWORD || "#awsmelb"

// Provider handler. Runs on a scheduled basis, extracting from Twitter
// and sending data to an SNS queue
// NOTE: Our handler here is just the trigger, none of the values are used!
const handler = (event, context, callback) => {
  console.log(`Running Twitter scraper for keyword ${MAGIC_KEYWORD}`)

  const repository = new CheckpointRepository()
  const scraper = new TwitterScraper(repository)

  scraper.run()
    .then(() => callback(null))
    .catch(callback)
}

class TwitterScraper {

  constructor(repository) {
    this.repository = repository
    this.count = 10
    this.lastItem = 0
  }

  run() {
    return this.getLastTwitterId()
      .then(this.getTweets.bind(this))
      .then(this.publishTweets.bind(this))
      .then(this.updateCheckpoint.bind(this))
  }

  getLastTwitterId() {
    return this.repository.getCheckpoint().then((lastItem) => {
      this.lastItem = lastItem
      return lastItem
    })
  }

  getTweets(lastItem) {
    return t.get('search/tweets', {
      q: `${MAGIC_KEYWORD} since_id:0`,
      // q: `${MAGIC_KEYWORD} since_id:${lastItem}`,
      count: this.count
    }).then((res) => {
      const tweets = []
      const statuses = res.data.statuses

      statuses.forEach((item) => {
        console.log(`Tweet: ${item.id} => ${item.text}`)
        tweets.push(item)
      })

      this.lastItem = (statuses.length > 0) ? statuses[0].id : lastItem
      console.log(`New last item: ${this.lastItem}`)

      return tweets
    })
  }

  publishTweets(tweets) {
    // TODO: Create repository for this as per Dynamo...
    const params = {
      Message: JSON.stringify(tweets),
      TopicArn: TOPIC_ARN
    }

    return sns.publish(params).promise()
  }

  updateCheckpoint() {
    return this.repository.save({
      Type: "twitter",
      LastItem: `${this.lastItem}`
    })
  }
}

class CheckpointRepository {
  constructor() {
    this.tableName = 'checkpoint'
  }
  save(doc) {
    const params = {
      TableName: this.tableName,
      Item: {
        "Type": {
          S: doc.Type,
        },
        "LastItem": {
          N: doc.LastItem,
        },
      },
      ReturnConsumedCapacity: "TOTAL",
    }
    return dynamodb.putItem(params).promise()
  }

  getCheckpoint() {
    const search = {
      TableName: this.tableName,
      Key: {
        "Type": {
          S: "twitter"
        },
      },
    }

    return dynamodb
      .getItem(search)
      .promise()
      .then((data) => {
        this.lastItem = data.Item.LastItem.N

        return this.lastItem
      })
  }
}

module.exports = {
  handler,
  CheckpointRepository,
  TwitterScraper,
}