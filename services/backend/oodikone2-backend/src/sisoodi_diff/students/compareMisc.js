const compareStarted = (oodi, sis, msg) => {
  if (oodi === sis) {
    return msg
  }

  return msg.concat(`  started diff:
    Oodi: ${oodi}
    SIS: ${sis}`)
}

module.exports = {
  compareStarted
}
