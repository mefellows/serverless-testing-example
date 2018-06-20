
// Authentication middleware
const authenticationMiddleware = () => ({
  before: (_, next) => {
    console.log('authenticating...')
    next()
  }
})

module.exports = {
  authenticationMiddleware
}