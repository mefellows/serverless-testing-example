// import request from 'superagent';
import mqtt from 'mqtt';
import moment from 'moment';
import SHA256 from 'crypto-js/sha256';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import hex from 'crypto-js/enc-hex';

const LAST_WILL_TOPIC = 'last-will';
const MESSAGE_TOPIC = 'message';
const CLIENT_CONNECTED = 'client-connected';
const CLIENT_DISCONNECTED = 'client-disconnected';

const getNotification = (clientId, username) => JSON.stringify({
  clientId,
  username
});

const validateClientConnected = (client) => {
  if (!client) {
    throw new Error("Client is not connected yet. Call client.connect() first!");
  }
};

/**
 * utilities to do sigv4
 * @class SigV4Utils
 */
function SigV4Utils() {}

SigV4Utils.sign = function (key, msg) {
  var hash = HmacSHA256(msg, key);
  return hash.toString(hex);
};

SigV4Utils.sha256 = function (msg) {
  var hash = SHA256(msg);
  return hash.toString(hex);
};

SigV4Utils.getSignatureKey = function (key, dateStamp, regionName, serviceName) {
  var kDate = HmacSHA256(dateStamp, 'AWS4' + key);
  var kRegion = HmacSHA256(regionName, kDate);
  var kService = HmacSHA256(serviceName, kRegion);
  var kSigning = HmacSHA256('aws4_request', kService);
  return kSigning;
};

var computeUrl = function () {
  // must use utc time
  var time = moment.utc();
  var dateStamp = time.format('YYYYMMDD');
  var amzdate = dateStamp + 'T' + time.format('HHmmss') + 'Z';
  var service = 'iotdevicegateway';
  var region = 'us-east-1';
  var secretKey = 'jEmxF/cOeJN27FSUdyu0A4zW5GkiaaqzKVsbD60I';
  var accessKey = 'AKIAJWAT6AHMHJF5EXEQ';
  var algorithm = 'AWS4-HMAC-SHA256';
  var method = 'GET';
  var canonicalUri = '/mqtt';
  var host = 'a2m1zb7kg84sa4.iot.us-east-1.amazonaws.com';

  var credentialScope = dateStamp + '/' + region + '/' + service + '/' + 'aws4_request';
  var canonicalQuerystring = 'X-Amz-Algorithm=AWS4-HMAC-SHA256';
  canonicalQuerystring += '&X-Amz-Credential=' + encodeURIComponent(accessKey + '/' + credentialScope);
  canonicalQuerystring += '&X-Amz-Date=' + amzdate;
  canonicalQuerystring += '&X-Amz-Expires=86400';
  canonicalQuerystring += '&X-Amz-SignedHeaders=host';

  var canonicalHeaders = 'host:' + host + '\n';
  var payloadHash = SigV4Utils.sha256('');
  var canonicalRequest = method + '\n' + canonicalUri + '\n' + canonicalQuerystring + '\n' + canonicalHeaders + '\nhost\n' + payloadHash;
  console.log('canonicalRequest ' + canonicalRequest);

  var stringToSign = algorithm + '\n' + amzdate + '\n' + credentialScope + '\n' + SigV4Utils.sha256(canonicalRequest);
  var signingKey = SigV4Utils.getSignatureKey(secretKey, dateStamp, region, service);
  console.log('stringToSign-------');
  console.log(stringToSign);
  console.log('------------------');
  console.log('signingKey ' + signingKey);
  var signature = SigV4Utils.sign(signingKey, stringToSign);

  canonicalQuerystring += '&X-Amz-Signature=' + signature;
  var requestUrl = 'wss://' + host + canonicalUri + '?' + canonicalQuerystring;
  return requestUrl;
};


export default (clientId, username) => {
  console.log("connecting as a client")
  const options = {
    will: {
      topic: LAST_WILL_TOPIC,
      payload: getNotification(clientId, username),
    }
  };
  let client = null;

  const clientWrapper = {};
  clientWrapper.connect = () => {
    return new Promise((resolve, reject) => {
      // return request('https://fn6ny4k8ca.execute-api.us-east-1.amazonaws.com/dev/iot-presigned-url')
      const url = computeUrl();
      console.log(`URL: ${url}`);
      client = mqtt.connect(url, options);
      client.on('connect', () => {
        console.log('Connected to AWS IoT Broker');
        client.subscribe(MESSAGE_TOPIC);
        client.subscribe(CLIENT_CONNECTED);
        client.subscribe(CLIENT_DISCONNECTED);
        const connectNotification = getNotification(clientId, username);
        client.publish(CLIENT_CONNECTED, connectNotification);
        console.log(`Sent message: ${CLIENT_CONNECTED} - ${connectNotification}`);
      });
      client.on('close', () => {
        console.log('Connection to AWS IoT Broker closed');
        client.end();
      });

      resolve();
    })
  }

  // clientWrapper.connect = () => {
  //   // return request('https://fn6ny4k8ca.execute-api.us-east-1.amazonaws.com/dev/iot-presigned-url')
  //   return request('/iot-presigned-url')
  //     .then(response => {
  //       console.log(response);

  //       client = mqtt.connect(response.body.url, options);
  //       client.on('connect', () => {
  //         console.log('Connected to AWS IoT Broker');
  //         client.subscribe(MESSAGE_TOPIC);
  //         client.subscribe(CLIENT_CONNECTED);
  //         client.subscribe(CLIENT_DISCONNECTED);
  //         const connectNotification = getNotification(clientId, username);
  //         client.publish(CLIENT_CONNECTED, connectNotification);
  //         console.log(`Sent message: ${CLIENT_CONNECTED} - ${connectNotification}`);
  //       });
  //       client.on('close', () => {
  //         console.log('Connection to AWS IoT Broker closed');
  //         client.end();
  //       });
  //     })
  // }
  clientWrapper.onConnect = (callback) => {
    validateClientConnected(client)
    client.on('connect', callback);
    return clientWrapper;
  };
  clientWrapper.onDisconnect = (callback) => {
    validateClientConnected(client)
    client.on('close', callback);
    return clientWrapper;
  };
  clientWrapper.onMessageReceived = (callback) => {
    validateClientConnected(client)
    client.on('message', (topic, message) => {
      console.log(`Received message: ${topic} - ${message}`);
      callback(topic, JSON.parse(message.toString('utf8')));
    });
    return clientWrapper;
  };
  clientWrapper.sendMessage = (message) => {
    validateClientConnected(client)
    client.publish(MESSAGE_TOPIC, JSON.stringify(message));
    console.log(`Sent message: ${MESSAGE_TOPIC} - ${JSON.stringify(message)}`);
    return clientWrapper;
  };
  return clientWrapper;
};