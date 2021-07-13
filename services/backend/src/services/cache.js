const LRU = require('lru-cache')

// Max 25 users can be stored in the cache
const userDataCache = new LRU({
  max: 25,
  length: () => 1,
  maxAge: 1000 * 60 * 60
})

module.exports = {
  userDataCache
}
