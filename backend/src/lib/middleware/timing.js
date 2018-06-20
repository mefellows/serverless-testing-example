let startTime

const timingMiddleware = () => ({
  before: (_, next) => {
    startTime = Date.now()
    next()
  },
  after: (_, next) => {
    console.log('timing', {
      duration: Date.now() - startTime
    })
    next()
  }
})

module.exports = {
  timingMiddleware
}