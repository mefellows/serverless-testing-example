var AWS = require("aws-sdk"); // must be npm installed to use
var sns = new AWS.SNS({
  endpoint: "http://127.0.0.1:4002",
  region: "us-east-1",
});
sns.publish({
  Message: JSON.stringify([{
    id: Math.floor(new Date() / 1000),
    // text: "this is an AMAZING tweet, wow this is a jolly good demo #FooeyFooFoo",
    text: "I'm really freaking angry! #FooeyFooFoo",
    // text: "That matt guy, what a jerk #FooeyFooFoo",
    user: {
      screen_name: "SummitOfDoom"
    }
  }]),
  TopicArn: "arn:aws:sns:us-east-1:123456789012:pact-events",
}, () => {
  console.log("ping");
});