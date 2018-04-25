const slsw = require('serverless-webpack');

module.exports = {
  entry: slsw.lib.entries,
  // output: set by the plugin
  target: 'node',
  externals: [
    /aws-sdk/, // Available on AWS Lambda
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: [
            [
              'env',
              {
                target: { node: '8.10' }, // Node version on AWS Lambda
                useBuiltIns: true,
                modules: false,
                loose: true
              }
            ],
            'stage-3'
          ]
        }
      }
    ]
  }
}
