const compareStarted = (oodi, sis, msg) => {
  if (oodi === sis) {
    return msg
  }

  return msg.concat(`  started diff:
    Oodi: ${oodi}
    SIS: ${sis}`)
}

const compareCredits = (oodi, sis, msg) => {
  if (oodi === sis) {
    return msg
  }

  const d = Number(sis) - Number(oodi)

  return msg.concat(`  credits diff:\t\t${d}\t(o: ${oodi} / s: ${sis})`)
}

module.exports = {
  compareStarted,
  compareCredits
}
