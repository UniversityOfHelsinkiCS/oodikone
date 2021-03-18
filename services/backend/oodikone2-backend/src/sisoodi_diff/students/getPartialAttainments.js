const axios = require('axios')
const { readFileSync, writeFileSync, statSync } = require('fs')
const moment = require('moment')

const filename = 'diff_partial_att_data.json'

const downloadPartialAttainments = async () => {
  console.log('INFO: Downloading new partial attainment data.\n')
  const token = process.env.IMPORTER_ARCHAEOLOGY_TOKEN
  const url = `https://importer.cs.helsinki.fi/archeology/assessmentItemsFromCoursesWithPartAttainments?token=${token}`
  const res = await axios.get(url)
  return res.data
}

const attainmentToCourseCode = att => att.name.fi.split(' ')[0]

const getPartialAttainments = async () => {
  try {
    const meta = statSync(filename)

    // FIXME: change to days
    if (moment().diff(meta.mtime, 'days') >= 1) {
      throw new Error()
    }

    const data = readFileSync(filename)
    return JSON.parse(data)
  } catch (error) {
    const data = await downloadPartialAttainments()
    const content = data.map(attainmentToCourseCode)
    writeFileSync(filename, JSON.stringify(content))
    return content
  }
}

module.exports = getPartialAttainments
