const moment = require('moment')

// Because seriously omfg
const mayhemifiedDatesMatch = (a, b) => {
  // Figure out which one is from oodi.
  let oodi, sis
  if (moment(a).hour() === 0) {
    sis = a
    oodi = b
  } else {
    oodi = a
    sis = b
  }

  // Then figure out if it's DST and fix the "timezone".
  const dst = moment(oodi).hour() === 21
  const tzFix = dst ? 3 : 2
  const oodiDate = moment(oodi).add(tzFix, 'hours')
  return oodiDate.isSame(sis)
}

module.exports = {
  mayhemifiedDatesMatch
}
