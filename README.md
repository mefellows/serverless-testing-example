# Serverless example

![serverless-logo](https://user-images.githubusercontent.com/53900/38163394-57ec9176-353f-11e8-80d1-b9f6d5f1773f.png)

Sample contract testing application running using the [Serverless](https://github.com/serverless/serverless) framework.

The very basic architecture is as follows:

`[Event Provider]` -> `[SNS]` <- `[Event Consumer]`


`[Twitter] <- [Twitter Fetch]` -> `[SNS]` <-  `[Twitter Publish]`
                                                   `↓`
                                  `[IoT]` <-> `[Summiteers]`
                                              `[Summit AWScenders]`

## Overview
<!-- TOC -->

- [Overview](#overview)
- [Test Services with Pact](#test-services-with-pact)
- [Deployment](#deployment)
  - [Pact Broker integration](#pact-broker-integration)
  - [Running deployment](#running-deployment)
- [Running](#running)
- [Cleaning up](#cleaning-up)
- [Further reading](#further-reading)
- [Set up the project](#set-up-the-project)
- [Set up the back-end](#set-up-the-back-end)
- [Set up the front-end](#set-up-the-front-end)

<!-- /TOC -->

**Message Producer**

Small utility that when invoked, publishes an "event" message to an SNS topic.

**Message Consumer**

Lambda function that reads from the SNS topic and processes the data - by incrementing a simple counter.

**Getting Started**

```
npm i
# Update as per your own Twitter account
export TWITTER_CONSUMER_KEY=<INSERT HERE>
export TWITTER_CONSUMER_SECRET=<INSERT HERE>
export TWITTER_ACCESS_TOKEN=<INSERT HERE>
export TWITTER_ACCESS_TOKEN_SECRET=<INSERT HERE>

```

## Test Services with Pact

To run both the consumer and provider pact tests:

```
npm t
```

Or individually:

```
npm run test:consumer
npm run test:publish # publish contracts to the broker
npm run test:provider
```

## Deployment

You can run this stack in AWS. It uses services within the [free tier](https://aws.amazon.com/free/?awsf.default=categories%23alwaysfree) to reduce potential costs.

To use any of the commands below, ensure you have valid [AWS credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) for your environment.

### Pact Broker integration

Using the test broker at https://test.pact.dius.com.au (user/pass: `dXfltyFMgNOFZAxr8io9wJ37iUpY42M` / `O5AIZWxelWbLvqMd8PkAVycBJh2Psyg1`), we make use of the [`can-i-deploy` tool](https://github.com/pact-foundation/pact_broker/wiki/Provider-verification-results#querying) (available from the [Pact CLI suite](https://github.com/pact-foundation/pact-ruby-standalone/releases) but also bundled as part of `pact`), that ensures it is safe to deploy the consumer or provider before a releasing a change.

Whenever we create, change or verify a contract with Pact, the results are shared with the broker, which is then able to determine compatibility between components at any point in time.

You can see this in action by running one of the following:

```sh
npm run can-i-deploy # For both
npm run can-i-deploy:consumer # Just consumer
npm run can-i-deploy:provider # Yep, just the provider
```

You will see something like:

```sh
Computer says yes \o/

CONSUMER             | C.VERSION | PROVIDER             | P.VERSION | SUCCESS?
---------------------|-----------|----------------------|-----------|---------
SNSPactEventConsumer | 1.0.1     | SNSPactEventProvider | 1.0.0     | true

All verification results are published and successful
```

### Running deployment

```sh
npm run deploy
```

This will first check with `can-i-deploy`. If you want to skip this process, you can simply run:

```sh
serverless deploy -f provider
serverless deploy -f consumer
```

## Running

**Invoking the provider**

```sh
serverless invoke -f provider -l
```

You should see something like:

```sh
matt λ serverless invoke -f provider -l
{
    "id": 65,
    "event": "an update to something useful",
    "type": "update"
}
--------------------------------------------------------------------
START RequestId: 87050842-3536-11e8-ba23-e7bc78dfd40c Version: $LATEST
END RequestId: 87050842-3536-11e8-ba23-e7bc78dfd40c
REPORT RequestId: 87050842-3536-11e8-ba23-e7bc78dfd40c	Duration: 169.04 ms	Billed Duration: 200 ms 	Memory Size: 1024 MB	Max Memory Used: 40 MB
```

**Watching the consumer**
```sh
serverless logs -f consumer -t
```

When an event is published to the topic, your consumer should log to console something like the following:

```sh
matt λ serverless logs -f consumer -t
START RequestId: 8784bf84-3536-11e8-be0c-038b85b513b9 Version: $LATEST
2018-04-01 08:54:55.878 (+10:00)	8784bf84-3536-11e8-be0c-038b85b513b9	Received event from SNS
2018-04-01 08:54:55.878 (+10:00)	8784bf84-3536-11e8-be0c-038b85b513b9	Event: { id: 65,
  event: 'an update to something useful',
  type: 'update' }
...
2018-04-01 08:54:55.881 (+10:00)	8784bf84-3536-11e8-be0c-038b85b513b9	Event count: 1
END RequestId: 8784bf84-3536-11e8-be0c-038b85b513b9
REPORT RequestId: 8784bf84-3536-11e8-be0c-038b85b513b9	Duration: 5.55 ms	Billed Duration: 100 ms 	Memory Size: 1024 MB	Max Memory Used: 32 MB
```

## Cleaning up

When you are done with your serverless stack, simply run:

```
serverless remove -v
```

## Further reading

For further reading and introduction into the topic of asynchronous services contract testing, see this [article](https://dius.com.au/2017/09/22/contract-testing-serverless-and-asynchronous-applications/)
and our other [example](https://github.com/pact-foundation/pact-js/tree/master/examples/messages) for a more detailed overview of these concepts.

##

# Serverless WebSockets chat based on AWS IoT and React

This is the source code for the [Serverless AWS IoT tutorial](http://gettechtalent.com/blog/tutorial-real-time-frontend-updates-with-react-serverless-and-websockets-on-aws-iot.html#react). It's a WebSockets chat app demonstration. The back-end is built on AWS Lambda using the [Serverless Framework](https://serverless.com/). The front-end is built on ReactJS using Bootstrap and [Create React App](https://github.com/facebookincubator/create-react-app).

Read below for how to set it up.

## Set up the project

- Log in into your AWS account or set up one https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/

- Create `serverless-deployer` IAM user
  - Navigate IAM -> Users and click "Add User"
  - Set "User name" to `serverless-deployer`
  - Set "Access type" to "Programmatic access" and click "Next"
  - Click "Attach existing policies directly"
  - Select "AdministratorAccess" from the list and click "Next"
  - Review information and click "Create user"
  - Click "Download .csv"

- Create `iot-connector` IAM user
  - Navigate IAM -> Users and click "Add User"
  - Set "User name" to `iot-connector`
  - Set "Access type" to "Programmatic access" and click "Next"
  - Click "Attach existing policies directly"
  - Select "AWSIoTDataAccess" from the list and click "Next"
  - Review information and click "Create user"
  - Click "Download .csv"

- Create a folder for the project: `mkdir serverless-aws-iot; cd serverless-aws-iot`

- Clone the repository: `git clone https://github.com/gettechtalent/REPO-LINK-HERE.git`

## Set up the back-end

- Navigate to the back-end folder: `cd backend`

- Install serverless: `npm install -g serverless`

- Configure serverless from the `serverless-deployer` .csv file
`serverless config credentials --provider aws --key <Access key ID> --secret <Secret access key> --profile serverless-demo`

- Edit `serverless.yml`. Under the `provider` section set the `region` to where your AWS Lambda functions will live. Also, make sure to set the `IOT_AWS_REGION` environment variable in the same file.

- Set `IOT_ACCESS_KEY` and `IOT_SECRET_KEY` from the `iot-connector` .csv file

- In the AWS console navigate to AWS IoT -> Settings. Set the `IOT_ENDPOINT_HOST` variable in the `serverless.yml` to the `Endpoint` that you see on the page.

- Install serverless: `npm install -g serverless`

- Install the dependencies: `npm install`

- Start up the lambdas locally: `serverless offline --port 8080 start`. You should see something like this:
![Alt text](/frontend/public/backend-start.png?raw=true "Offline listening on http://localhost:8080")

- Navigate in the browser to `localhost:8080/iot-presigned-url`. You should see something like this:
`{"url":"wss://3kdfgh39sdfyrte.iot.eu-west-1.amazonaws.com/mqtt?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=DSJHGRJWFICUIYWEFSSD%2F20170529%2Feu-west-1%2Fiotdevicegateway%2Faws4_request&X-Amz-Date=20170529T063531Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=435876t863fd8fk43jtygdf34598e9ghdrt439g8rytk34hfd9854y3489tfydee"}`

## Set up the front-end

- Navigate to the front-end folder: `cd ../frontend`

- Install the dependencies: `npm install`

- Start up the front-end locally: `npm start`. You should see something like this:
![Alt text](/frontend/public/frontend-start.png?raw=true "Compiled successfully!")

- Navigate in the browser to `localhost:3000`. You should see the Serverless IoT WebSockets chat app in action.

- Feel free to open several browser tabs with the app and send some chat messages. You will see `Connected users` as well as `Messages` sections populated.

![Alt text](/frontend/public/chat-window.png?raw=true "Chat app screenshot")
