var stan = require('node-nats-streaming').connect('updaterNATS', 'producer', process.env.NATS_URI)

stan.on('connect', () => {
  stan.publish('Update', '014441008', (err, guid) => {
    if (err) {
      console.log('publish failed')
    } else {
      console.log('published', guid)
    }
  })
})

