/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
const { MessageConsumer, Message, synchronousBodyHandler, Matchers } = require("@pact-foundation/pact");
const { like, term } = Matchers;
const path = require("path");

// Dummy event consumer for now
// as long as it doesn't fail, we're good
const consumeEvent = () => true

describe("AWS Summiteer Web - Chat", () => {
  const messagePact = new MessageConsumer({
    consumer: "AWSSummiteerWeb",
    dir: path.resolve(process.cwd(), "pacts"),
    // provider: "AWSSummiteerWeb", // Self-relation!
    provider: "AWSSummiteerIoT", // Self-relation, but we're just giving it a name
  });

  describe("receive a chat event", () => {
    it("should accept a valid chat message", () => {
      return messagePact
        .given("there are new messages")
        .expectsToReceive("a message from the chat room")
        .withContent({
          id: like(1),
          user: like("matt"),
          text: like("Hello fellow AWS friends, care for some more serverless kool-aid 🍵?")
        })
        .withMetadata({
          "content-type": "application/json",
        })
        .verify(synchronousBodyHandler(consumeEvent));
    });
  });
});
