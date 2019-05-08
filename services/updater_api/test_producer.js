var stan = require('node-nats-streaming').connect('updaterNATS', 'producer', process.env.NATS_URI)

stan.on('connect', () => {
  stan.publish('UpdateApi', 'meta'  , (err, guid) => {
    if (err) {
      console.log('publish failed')
    } else {
      console.log('published', guid)
    }
  })
  stan.publish('UpdateApi', '011120775'  , (err, guid) => {
    if (err) {
      console.log('publish failed')
    } else {
      console.log('published', guid)
    }
  })
  stan.publish('UpdateApi', '014441008'  , (err, guid) => {
    if (err) {
      console.log('publish failed')
    } else {
      console.log('published', guid)
    }
  })
  stan.publish('UpdateApi', '014272112'  , (err, guid) => {
    if (err) {
      console.log('publish failed')
    } else {
      console.log('published', guid)
    }
  })
})

