/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
const { MessageConsumer, Message, synchronousBodyHandler, Matchers } = require("@pact-foundation/pact");
const { like, term } = Matchers;
const path = require("path");

// const consumeEvent = require("./index").consumeEvent;
const consumeEvent = () => true

describe("Sentiment - Consumer Tests", () => {
  const messagePact = new MessageConsumer({
    consumer: "AWSSummiteerWeb",
    dir: path.resolve(process.cwd(), "pacts"),
    provider: "AWSSummiteerSentimentSNSProvider",
  });

  describe("receive new sentiments", () => {
    it("should ", () => {
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
        .verify(synchronousBodyHandler(consumeEvent));
    });
  });
});

describe("Sentiment - Twitter Consumer tests", () => {
  const messagePact = new MessageConsumer({
    consumer: "AWSSummiteerSentimentSNSProvider",
    dir: path.resolve(process.cwd(), "pacts"),
    provider: "AWSSummiteerTwitterSNSProvider",
  });

  describe("receive new sentiments", () => {
    it("should ", () => {
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
        .verify(synchronousBodyHandler(consumeEvent));
    });
  });
});

