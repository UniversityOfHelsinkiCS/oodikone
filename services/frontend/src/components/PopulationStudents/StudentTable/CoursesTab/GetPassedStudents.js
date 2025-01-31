export const getPassedStudents = (curriculum, populationCourses) => {
  if (
    !curriculum?.defaultProgrammeCourses ||
    !curriculum?.secondProgrammeCourses ||
    !populationCourses?.coursestatistics
  ) {
    return {}
  }

  const getCourseCodes = curriculum => {
    return [
      ...curriculum.defaultProgrammeCourses.filter(course => course.visible?.visibility).map(course => course.code),
      ...curriculum.secondProgrammeCourses.filter(course => course.visible?.visibility).map(course => course.code),
    ]
  }

  const { coursestatistics } = populationCourses

  const courseCodes = getCourseCodes(curriculum)

  const findCourseByCode = courseCode => coursestatistics.find(item => item.course.code === courseCode)

  const getPassedStudentsForCourse = course => {
    const students = Object.keys(course.students.passed)
    return students.length > 0 ? students : []
  }

  const filterStudentsWithPassedMainCourse = (mainPassed, subCourse) => {
    const students = getPassedStudentsForCourse(subCourse)
    return students.filter(student => !mainPassed.includes(student))
  }

  const getPassedCourses = () => {
    const result = courseCodes.reduce(
      (passed, courseCode) => {
        const mainCourse = findCourseByCode(courseCode)

        if (mainCourse) {
          passed.main[courseCode] = getPassedStudentsForCourse(mainCourse)
          const { substitutions } = mainCourse.course

          substitutions.forEach(subCode => {
            const subCourse = findCourseByCode(subCode)
            if (subCourse && mainCourse.course.code !== subCode) {
              passed.sub[courseCode] = filterStudentsWithPassedMainCourse(passed.main[courseCode], subCourse)
            }
          })
        }
        return passed
      },
      { main: [], sub: [] }
    )

    return result
  }

  const { main: passedStudents, sub: passedSubstitutionStudents } = getPassedCourses()

  return { passedStudents, passedSubstitutionStudents }
}
