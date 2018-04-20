/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
const { MessageConsumer, Message, synchronousBodyHandler, Matchers } = require("@pact-foundation/pact");
const { like, term } = Matchers;
const path = require("path");

// Dummy event consumer for now
// as long as it doesn't fail, we're good
const consumeEvent = () => true

describe("AWS Summiteer Web - Twitter", () => {
  const messagePact = new MessageConsumer({
    consumer: "AWSSummiteerWeb",
    dir: path.resolve(process.cwd(), "pacts"),
    provider: "AWSSummiteerTwitterSNSConsumer",
  });

  describe("receive a tweet stream", () => {
    it("should accept a valid tweet", () => {
      return messagePact
        .given("there are new tweets")
        .expectsToReceive("a stream of tweets")
        .withContent({
          id: like(1),
          text: like("some tweet content with emoji 😎")
        })
        .withMetadata({
          "content-type": "application/json",
        })
        .verify(synchronousBodyHandler(consumeEvent));
    });
  });
});
