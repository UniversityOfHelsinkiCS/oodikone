const toDate = (dd) => {
  if (dd.indexOf('-')==-1) return dd

  const [y, m, d] = dd.split('-')
  return `${d}.${m}.${y}`
}

const format = (course) => {
  if (course.courseinstance) {
    return {
      date: toDate(course.courseinstance.coursedate),
      code: course.courseinstance.course.code,
    }
  }

  return {
    date: course.courseInstance.date,
    code: course.courseInstance.course.courseCode
  }
}

const byCode = (c1, c2) => c1.code < c2.code ? -1 : 1

const withCode = (code) => (course) => {
  return course.courseinstance.course_code === code
}

const withCodeAndDate = (cc) => (course) => {
  return course.courseinstance.course_code === cc.code && toDate(course.courseinstance.coursedate) === cc.date
}

const codeAndDateMatchesOodiKone = (course) => (cc) => {
  return course.courseinstance.course_code === cc.courseInstance.course.courseCode && toDate(course.courseinstance.coursedate) === cc.courseInstance.date
}

const formatCourses = (courses) => {
  return courses.map(format).sort(byCode)
}

const difference = (c1, c2) => {

  const coursesInOodiKone = formatCourses(c2)
  const coursesInWebOodi = formatCourses(c1)

  const problems = []

  console.log('courses in OodiKone', coursesInOodiKone.length)
  console.log('courses in WebOodi', coursesInWebOodi.length)

  coursesInWebOodi.forEach(c => {
    const same = coursesInOodiKone.filter(a => {
      return a.date === c.date && a.code === c.code
    })

    if (same.length === 0) {
      console.log('missing from OodiKone', c)
      problems.push(c)
    } else if (same.length > 1) {
      const other = coursesInWebOodi.filter(a => {
        return a.date === c.date && a.code === c.code
      })
      if (other.length !== same.length) {
        console.log(c, same.length, 'times in OodiKone ', other.length, ' in WebOodi')
        problems.push(c)
      }
    }
  })

  coursesInOodiKone.forEach(c => {
    const same = coursesInWebOodi.filter(a => {
      return a.date === c.date && a.code === c.code
    })
    if (same.length === 0) {
      console.log('missing from WebOodi', c)
      problems.push(c)
    } else if (same.length>1) {
      const other = coursesInOodiKone.filter(a => {
        return a.date === c.date && a.code === c.code
      })
      if (other.length !== same.length) {
        console.log(c, same.length, 'times in WebOodi ', other.length, ' in Oodikone')
        problems.push(c)
      }      
    }
  })

  return problems
}

const differenceWithOodi = (studentCourseCreditsInOodi, student) => {
  const problems = difference(studentCourseCreditsInOodi, student.credits)

  problems.forEach(course => {
    console.log('-------')
    student.credits.filter(withCodeAndDate(course)).forEach(k => {
      console.log(JSON.stringify(k, null, 2))
    })
  }) 
}

module.exports = {
  format,
  byCode,
  withCode,
  formatCourses,
  difference, 
  differenceWithOodi, 
  codeAndDateMatchesOodiKone,
  toDate
}