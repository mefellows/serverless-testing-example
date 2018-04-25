'use strict'

const v4 = require('aws-signature-v4')
const crypto = require('crypto')
const moment = require('moment')
const SHA256 = require('crypto-js/sha256')
const HmacSHA256 = require('crypto-js/hmac-sha256')
const hex = require('crypto-js/enc-hex')

// API to retrieve a pre-signed URL for access to IoT
exports.handler = (event, context, callback) => {
  const url = computeUrl()

  const response = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    statusCode: 200,
    body: JSON.stringify({
      url: url
    }),
  }

  callback(null, response)
}

function SigV4Utils() { }

SigV4Utils.sign = function (key, msg) {
  let hash = HmacSHA256(msg, key)
  return hash.toString(hex)
}

SigV4Utils.sha256 = function (msg) {
  let hash = SHA256(msg)
  return hash.toString(hex)
}

SigV4Utils.getSignatureKey = function (key, dateStamp, regionName, serviceName) {
  let kDate = HmacSHA256(dateStamp, 'AWS4' + key)
  let kRegion = HmacSHA256(regionName, kDate)
  let kService = HmacSHA256(serviceName, kRegion)
  let kSigning = HmacSHA256('aws4_request', kService)
  return kSigning
}

let computeUrl = function () {
  // must use utc time
  let time = moment.utc()
  let dateStamp = time.format('YYYYMMDD')
  let amzdate = dateStamp + 'T' + time.format('HHmmss') + 'Z'
  let service = 'iotdevicegateway'
  let region = process.env.IOT_AWS_REGION
  let secretKey = process.env.IOT_SECRET_KEY
  let accessKey = process.env.IOT_ACCESS_KEY
  let algorithm = 'AWS4-HMAC-SHA256'
  let method = 'GET'
  let canonicalUri = '/mqtt'
  let host = process.env.IOT_ENDPOINT_HOST

  let credentialScope = dateStamp + '/' + region + '/' + service + '/' + 'aws4_request'
  let canonicalQuerystring = 'X-Amz-Algorithm=AWS4-HMAC-SHA256'
  canonicalQuerystring += '&X-Amz-Credential=' + encodeURIComponent(accessKey + '/' + credentialScope)
  canonicalQuerystring += '&X-Amz-Date=' + amzdate
  canonicalQuerystring += '&X-Amz-Expires=86400'
  canonicalQuerystring += '&X-Amz-SignedHeaders=host'

  let canonicalHeaders = 'host:' + host + '\n'
  let payloadHash = SigV4Utils.sha256('')
  let canonicalRequest = method + '\n' + canonicalUri + '\n' + canonicalQuerystring + '\n' + canonicalHeaders + '\nhost\n' + payloadHash
  console.log('canonicalRequest ' + canonicalRequest)

  let stringToSign = algorithm + '\n' + amzdate + '\n' + credentialScope + '\n' + SigV4Utils.sha256(canonicalRequest)
  let signingKey = SigV4Utils.getSignatureKey(secretKey, dateStamp, region, service)
  console.log('stringToSign-------')
  console.log(stringToSign)
  console.log('------------------')
  console.log('signingKey ' + signingKey)
  let signature = SigV4Utils.sign(signingKey, stringToSign)

  canonicalQuerystring += '&X-Amz-Signature=' + signature
  let requestUrl = 'wss://' + host + canonicalUri + '?' + canonicalQuerystring
  return requestUrl
}

let getPresignedUrlViaAPI = () => v4.createPresignedURL(
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
)