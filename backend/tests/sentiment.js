const AWS = require('aws-sdk');
var params = {
  LanguageCode: 'en',
  TextList: [
    "you're a moron",
    "I'm really excited for this demo, not sure what to expect!"
  ]
};
var comprehend = new AWS.Comprehend({
  region: "us-east-1"
});
comprehend.batchDetectSentiment(params, function (err, data) {
  if (err) console.dir(err, err.stack); // an error occurred
  else console.dir(data); // successful response
});