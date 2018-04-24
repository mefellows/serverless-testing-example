'use strict';

const v4 = require('aws-signature-v4');
const crypto = require('crypto');
const moment = require('moment');
const SHA256 = require('crypto-js/sha256');
const HmacSHA256 = require('crypto-js/hmac-sha256');
const hex = require('crypto-js/enc-hex');

// API to retrieve a pre-signed URL for access to IoT
exports.handler = (event, context, callback) => {
  const url = computeUrl();

  const response = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    statusCode: 200,
    body: JSON.stringify({
      url: url
    }),
  };

  callback(null, response);
};

function SigV4Utils() { }

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
  var region = process.env.IOT_AWS_REGION;
  var secretKey = process.env.IOT_SECRET_KEY;
  var accessKey = process.env.IOT_ACCESS_KEY;
  var algorithm = 'AWS4-HMAC-SHA256';
  var method = 'GET';
  var canonicalUri = '/mqtt';
  var host = process.env.IOT_ENDPOINT_HOST;

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

var getPresignedUrlViaAPI = () => v4.createPresignedURL(
  'GET',
  process.env.IOT_ENDPOINT_HOST.toLowerCase(),
  '/mqtt',
  'iotdevicegateway',
  crypto.createHash('sha256').update('', 'utf8').digest('hex'), {
    'key': process.env.IOT_ACCESS_KEY,
    'secret': process.env.IOT_SECRET_KEY,
    'protocol': 'wss',
    'region': process.env.IOT_AWS_REGION,
  }
);