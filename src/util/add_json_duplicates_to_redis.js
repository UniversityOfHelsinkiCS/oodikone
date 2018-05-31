const { setDuplicateCode } = require('../services/courses')
const newToOld = require('./newToOld.json')
const oldToNew = require('./oldToNew.json')

const mapJson = async () => {

  for (const i in newToOld) {
    await setDuplicateCode(i, newToOld[i])
  }
  for (const i in oldToNew) {
    await setDuplicateCode(i, oldToNew[i])
  }
}

mapJson()
