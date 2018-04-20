'use strict';

const AWS = require('aws-sdk');

AWS.config.region = process.env.IOT_AWS_REGION;
const iotData = new AWS.IotData({ endpoint: process.env.IOT_ENDPOINT_HOST });

// Consumer handler, responsible for extracting message from SNS
// and dealing with lambda-related things.
const handler = (event, context, callback) => {
  console.log("Received event from SNS");

  event.Records.forEach(e => {
    console.log("Event:", JSON.parse(e.Sns.Message));
    consumeEvent(JSON.parse(e.Sns.Message))
  });

  let params = {
    topic: 'client-disconnected',
    payload: JSON.stringify(message),
    qos: 0
  };

  iotData.publish(params, function (err, data) {
    if (err) {
      console.log(`Unable to notify IoT of stories update: ${err}`);
    }
    else {
      console.log('Successfully notified IoT of stories update');
    }
  });

  callback(null, {
    event
  });
};

let tweetCount = 0;

// Actual consumer code, has no Lambda/AWS/Protocol specific stuff
// This is the thing we test in the Consumer Pact tests
const consumeEvent = (event) => {
  console.log('consuming tweets', event)

  if (!event) {
    throw new Error("Invalid event, missing fields")
  }

  // You'd normally do something useful, like process it
  // and save it in Dynamo
  console.log('Event count:', ++tweetCount);

  return tweetCount;
}

module.exports = {
  handler,
  consumeEvent
};


'use strict';

const AWS = require('aws-sdk');

AWS.config.region = process.env.IOT_AWS_REGION;
const iotData = new AWS.IotData({ endpoint: process.env.IOT_ENDPOINT_HOST });

exports.handler = (message) => {
  let params = {
    topic: 'client-disconnected',
    payload: JSON.stringify(message),
    qos: 0
  };

  iotData.publish(params, function (err, data) {
    if (err) {
      console.log(`Unable to notify IoT of stories update: ${err}`);
    }
    else {
      console.log('Successfully notified IoT of stories update');
    }
  });
};
