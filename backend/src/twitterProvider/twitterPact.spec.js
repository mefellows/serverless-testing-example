/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
const { MessageConsumer, Message, synchronousBodyHandler, Matchers } = require("@pact-foundation/pact");
const { like, term } = Matchers;
const path = require("path");

// Dummy event consumer for now
// as long as it doesn't fail, we're good
const consumeEvent = () => true

describe("AWS Summiteer Twitter Provider - Twitter", () => {
  const messagePact = new MessageConsumer({
    consumer: "AWSSummiteerTwitterSNSProvider",
    dir: path.resolve(process.cwd(), "pacts"),
    provider: "Twitter",
  });

  context("given the twitter scraper runs every minute", () => {
    describe("when receiving a stream of tweets", () => {
      it("should push the tweets to the consumer", () => {
        return messagePact
          .given("there are new tweets")
          .expectsToReceive("a list of twetes")
          .withContent({
            id: like(1),
            text: like("goodbye, cruel world"),
          })
          .withMetadata({
            "content-type": "application/json",
          })
          .verify(synchronousBodyHandler(consumeEvent));
      });
    });
  });
});
