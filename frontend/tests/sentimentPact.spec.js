/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
const { MessageConsumer, Message, synchronousBodyHandler, Matchers } = require("@pact-foundation/pact");
const { like, term } = Matchers;
const path = require("path");

// Pretent to be the consumer here
const { handleSentiment } = require('../src/SentimentHandler');

describe("Sentiment - Consumer Tests", () => {
  const messagePact = new MessageConsumer({
    consumer: "AWSSummiteerWeb",
    dir: path.resolve(process.cwd(), "pacts"),
    provider: "AWSSummiteerSentimentSNSProvider",
  });

  describe("receive new sentiments", () => {
    it("should be able to receive a new sentiment", () => {
      return messagePact
        .expectsToReceive("a sentiment update")
        .withContent({
          Positive: like(1),
          Negative: like(1),
          Neutral: like(1),
          Mixed: like(1),
        })
        .withMetadata({
          "content-type": "application/json",
        })
        .verify(synchronousBodyHandler(handleSentiment));
    });
  });
});

