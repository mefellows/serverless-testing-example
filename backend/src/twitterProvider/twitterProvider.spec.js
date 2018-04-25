/* tslint:disable:no-unused-expression object-literal-sort-keys max-classes-per-file no-empty */
const { TwitterScraper } = require('./index')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect

chai.use(chaiAsPromised)
describe.only("TwitterScraper", () => {
  context("#getLastTwitterId", () => {
    describe("when there is an existing id", () => {
      it("should retrieve the last id from Dynamo and store it", () => {
        const repositoryMock = {
          getCheckpoint: () => Promise.resolve(1234)
        }
        const scraper = new TwitterScraper(repositoryMock)

        expect(scraper.getLastTwitterId()).to.eventually.eql(1234)
      })
    })
  })
})
