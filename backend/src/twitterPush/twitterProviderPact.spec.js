/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
const { MessageConsumer, Message, synchronousBodyHandler, Matchers } = require("@pact-foundation/pact")
const { like, term } = Matchers
const path = require("path")
const _ = require('lodash')

// Dummy event consumer for now
// as long as it doesn't fail, we're good
const consumeEvent = () => true

describe("AWS Summiteer Twitter Push - Provider", () => {
  const messagePact = new MessageConsumer({
    consumer: "AWSSummiteerTwitterSNSConsumer",
    dir: path.resolve(process.cwd(), "pacts"),
    provider: "AWSSummiteerTwitterSNSProvider",
  })

  describe("receive a disconnect event", () => {
    it("should accept a valid disconnect message", () => {
      return messagePact
        .given("a user d/c from the service")
        .expectsToReceive("a last will and testament notification")
        .withContent({
          id: like(1),
          message: like("goodbye, cruel world"),
        })
        .withMetadata({
          "content-type": "application/json",
        })
        .verify(synchronousBodyHandler(consumeEvent))
    })
  })
})