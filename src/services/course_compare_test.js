const { instancesOf, yearlyStatsOf } = require('./courses')


const get = async () => {
  const inst = await instancesOf('581305')
  console.log(inst)
  const wantedInst = await yearlyStatsOf('581305', '2008')
}

get() 