var stan = require('node-nats-streaming').connect(
  'updaterNATS',
  process.env.HOSTNAME,
  process.env.NATS_URI
)

const { refreshAssociationsInRedis } = require('./services/studyrights')
const { getAllProgrammes } = require('./services/studyrights')
const { productivityStatsForStudytrack, throughputStatsForStudytrack } = require('./services/studytrack')
const { setProductivity, setThroughput, patchProductivity, patchThroughput } = require('./services/analyticsService')

const taskStatuses = { }
const handleMessage = (asyncHandlerFunction) => async (msg) => {
  const key = msg.getSubject()+'_'+msg.getData()
  if (taskStatuses[key])
    return
  stan.publish('status', key+':RECEIVED', (err) => {
    if(err) {
      console.log('publish failed', err)
    }
  })
  taskStatuses[key] = true
  const success = await asyncHandlerFunction(msg)
  taskStatuses[key] = false
  stan.publish('status', key+(success ? ':DONE' : ':ERRORED'), (err) => {
    if(err) {
      console.log('publish failed', err)
    }
  })
  msg.ack()
}

const StartNats = () => {
  console.log(`STARTING WITH ${process.env.HOSTNAME} as id`)
  var opts = stan.subscriptionOptions()
  opts.setManualAckMode(true)
  // opts.setAckWait(6*60*60*1000)
  // opts.setDeliverAllAvailable()
  // opts.setDurableName('durable')
  opts.setMaxInFlight(1)
  stan.on('connect', async function() {
    stan.subscribe('RefreshStudyrightAssociations', opts).on('message', handleMessage(async () => {
      try {
        await refreshAssociationsInRedis()
      } catch (e) {
        console.error(e)
        return false
      }
      return true
    }))
    stan.subscribe('RefreshOverview', opts).on('message', handleMessage(async () => {
      try {
        console.log('RefreshOverview starting')
        const codes = (await getAllProgrammes()).map(p => p.code)

        let ready = 0
        for(const code of codes) {
          try {
            await patchThroughput({ [code]: { status: 'RECALCULATING' } })
            const since = new Date().getFullYear() - 5
            const data = await throughputStatsForStudytrack(
              code,
              since
            )
            await setThroughput(
              data
            )
          } catch (e) {
            try {
              await patchThroughput({ [code]: { status: 'RECALCULATION ERRORED' } })
            } catch (e) {
              console.error(
                e
              )
            }
            console.error(e)
            console.log(
              `Failed to update throughput stats for code: ${code}, reason: ${
                e.message
              }`
            )
          }
          try {
            await patchProductivity({ [code]: { status: 'RECALCULATING' } })
            const since = '2017-08-01'
            const data = await productivityStatsForStudytrack(code, since)
            await setProductivity(data)

          } catch (e) {
            try {
              await patchProductivity({
                [code]: { status: 'RECALCULATION ERRORED' }
              })
            } catch (e) {
              console.error(e)
            }
            console.error(e)
            console.log(`Failed to update productivity stats for code: ${code}, reason: ${e.message}`)
          }
          ready += 1
          console.log(
            `RefreshOverview ${ready}/${
              codes.length
            } done`
          )
        }
      } catch (e) {
        console.error(e)
        return false
      }
      return true
    }))
  })
  return stan
}

module.exports = {
  StartNats
}
