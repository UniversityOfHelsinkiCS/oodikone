var stan = require('node-nats-streaming').connect('updaterNATS', 'producer', process.env.NATS_URI)

stan.on('connect', () => {
  stan.publish('UpdateApi', '011120775'  , (err, guid) => {
    if (err) {
      console.log('publish failed')
    } else {
      console.log('published', guid)
    }
  })
})

