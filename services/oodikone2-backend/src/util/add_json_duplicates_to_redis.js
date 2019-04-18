const { setDuplicateCode } = require('../services/courses')
const newToOld = require('./newToOld.json')
const oldToNew = require('./oldToNew.json')

const mapJson = async () => {

  for (const i in newToOld) {
    await setDuplicateCode(i, newToOld[i])
    await setDuplicateCode(newToOld[i], i)

  }
  for (const i in oldToNew) {
    await setDuplicateCode(i, oldToNew[i])
    await setDuplicateCode(oldToNew[i], i)
  }
  console.log('Mapped codes from newToOld.json and oldToNew.json')
  process.exit()
}

mapJson()
