const kafka = require('kafka-node')

const client = new kafka.KafkaClient({ kafkaHost: 'kafka:9092' })

const consumer = new kafka.Consumer(
  client,[
    { topic: 'studentnumbers' }
  ]
)

consumer.on('message', (message) => {
  const { value } = message
  console.log(message)
  if (value === '00000000') {
    console.log('should update pre-updater data')
  } else if (value === '99999999') {
    console.log('should update after-updater data')
  } else {
    console.log('update student')
  }
})

consumer.on('error', (err) => {
  console.log('ERROR ERROR ', err)
})

