const compareStarted = (oodi, sis, msg) => {
  if (oodi === sis) {
    return msg
  }

  return msg.concat(`  started diff:
    Oodi: ${oodi}
    SIS: ${sis}`)
}

const compareCredits = (totalCredits, courses, msg) => {
  const totalFromCourses = courses.map(c => c.credits).reduce((a, b) => a + Number(b), 0)

  if (totalCredits === totalFromCourses) {
    return msg
  }

  const d = totalCredits - totalFromCourses
  return msg.concat(`  credits diff:\t\t${d}\t(o: ${totalCredits} / s: ${totalFromCourses})`)
}

module.exports = {
  compareStarted,
  compareCredits
}
