const LRU = require('lru-cache')

// Max 25 users can be stored in the cache
const userDataCache = new LRU({
  max: 25,
  length: () => 1,
  maxAge: 1,
})

module.exports = {
  userDataCache,
}
