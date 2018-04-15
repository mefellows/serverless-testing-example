/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
const consumeEvent = require("./index").consumeEvent;
const { MessageConsumer, Message, synchronousBodyHandler, Matchers } = require("@pact-foundation/pact");
const { like, term } = Matchers;
const path = require("path");

describe("Serverless consumer tests", () => {
  const messagePact = new MessageConsumer({
    consumer: "SNSPactEventConsumer",
    dir: path.resolve(process.cwd(), "pacts"),
    provider: "SNSPactEventProvider",
  });

  describe("receive a pact event", () => {
    it("should accept a valid event", () => {
      return messagePact
        .expectsToReceive("a request to save an event")
        .withContent({
          id: like(1),
          event: like("something important"),
          type: term({ generate: "save", matcher: "^(save|update|cancel)$" }),
        })
        .withMetadata({
          "content-type": "application/json",
        })
        .verify(synchronousBodyHandler(consumeEvent));
    });
  });
});
