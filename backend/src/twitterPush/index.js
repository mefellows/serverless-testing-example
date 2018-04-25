'use strict'

const AWS = require('aws-sdk')

AWS.config.region = process.env.IOT_AWS_REGION
const iotData = new AWS.IotData({ endpoint: process.env.IOT_ENDPOINT_HOST })
const comprehend = new AWS.Comprehend({ region: "us-east-1" })

let tweetCount = 0

// Consumer handler, responsible for extracting message from SNS
// and dealing with lambda-related things.
const handler = (event, context, callback) => {
	console.log("Received event from SNS")

	event.Records.forEach(e => {
		console.log("Event:", JSON.parse(e.Sns.Message))
		consumeEvent(JSON.parse(e.Sns.Message))
	})

	callback(null, {
		event
	})
}

// Actual consumer code, has no Lambda/AWS/Protocol specific stuff
// This is the thing we test in the Consumer Pact tests
const consumeEvent = (event) => {
	console.log('consuming tweets', event)

	if (!event) {
		throw new Error("Invalid event, missing fields")
	}

  let params = {
    topic: 'tweets',
    payload: JSON.stringify(event),
    qos: 0
  }
  iotData.publish(params, function (err, data) {
    if (err) {
      console.log(`Unable to notify IoT of stories update: ${err}`)
    } else {
      console.log('Successfully notified IoT of stories update')
    }
  })

  console.log('Tweet count:', ++tweetCount)

  return {
    tweetCount,
  }
}

module.exports = {
	handler,
	consumeEvent
}