'use strict';

const Twit = require('twit')
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();
const sns = new AWS.SNS();
const t = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
})
const TOPIC_ARN = process.env.TOPIC_ARN;
const MAGIC_KEYWORD = process.env.MAGIC_KEYWORD || "#awsmelb";
const tableName = 'checkpoint';
const count = 10;
let lastItem = null;

// Provider handler. Runs on a scheduled basis, extracting from Twitter
// and sending data to an SNS queue
const handler = (event, context, callback) => {
  console.log(`Running Twitter scraper for keyword ${MAGIC_KEYWORD}`);

  // 1. Check last dynamodb record, if empty we'll set it in a minute
  const search = {
    TableName: tableName,
    Key: {
      "Type": {
        S: "twitter"
      },
    },
  };
  dynamodb.getItem(search,
    (err, data) => {
      if (err) {
        console.log(err, err.stack);
      } else {
        lastItem = data.Item.LastItem.N
        console.log(`Retreived last item: ${lastItem}`);

        // 2. Find all tweets
        t.get('search/tweets', {
          // q: `${MAGIC_KEYWORD} since_id:${lastItem}`, // TODO: revert this
          q: `${MAGIC_KEYWORD} since_id:0`,
          count
        }, (err, data) => {
          console.log(err, data)
          const tweets = [];

          data.statuses.forEach((item) => {
            console.log(`Tweet: ${item.id} => ${item.text}`);
            // TODO: add our own Tweet format
            tweets.push(item);
          })

          lastItem = (data.statuses.length > 0) ? data.statuses[0].id : lastItem
          console.log(`New last item: ${lastItem}`);

          // 3. Send tweets to queue for processing
          var params = {
            Message: JSON.stringify(tweets),
            TopicArn: TOPIC_ARN
          };
          sns.publish(params, (error, data) => {
            if (error) {
              callback(error);
            }

            callback(null, {
              message: 'Message successfully published to SNS topic "pact-events"',
              event
            });
          });

          // 4. Update DynamoDB table checkpoint
          params = {
            TableName: tableName,
            Item: {
              "Type": {
                S: "twitter",
              },
              "LastItem": {
                N: `${lastItem}`,
              },
            },
            ReturnConsumedCapacity: "TOTAL",
          };

          console.log("Put dynamodb: ", params)
          dynamodb.putItem(params, (err, data) => {
            callback(null, {
              lastItem,
              err,
              data
            });
          });
        })
      }
    });
};

module.exports = {
  handler,
};