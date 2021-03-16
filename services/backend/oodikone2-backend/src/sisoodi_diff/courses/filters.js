const filterCourseDiff = diff =>
  diff.map(course => {
    let missingStudents = course.missingStudents
    let extraStudents = course.extraStudents
    let ignoredStudentsCount = 0

    // Deleted attainments that old updater hasn't removed
    if (course.coursecode === 'TKT10002') {
      ignoredStudentsCount += missingStudents.length
      missingStudents = missingStudents.filter(student => student.year !== '2020-21')
      ignoredStudentsCount -= missingStudents.length
    }

    return { ...course, missingStudents, extraStudents, ignoredStudentsCount }
  })

module.exports = { filterCourseDiff }
