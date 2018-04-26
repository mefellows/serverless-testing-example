const _  = require('lodash');

module.exports = {
  handleSentiment: (sentiment) => {
    console.log('Handling Sentiment', sentiment)
    const requiredFields = ["Positive", "Negative", "Neutral", "Mixed"]

    if(_.difference(requiredFields, _.keys(sentiment)).length !== 0) {
      throw new Error("Missing keys, should have: " + requiredFields.join(", "))
    }

    return sentiment
  }
}