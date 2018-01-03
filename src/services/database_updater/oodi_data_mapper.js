const getStudyRightIdStrings = (data) => {
  const arr = data['data']
  let strings = []
  for (let i = 0; i < arr.length; i++) {
    strings.push(arr[i][0])
  }
  return strings
}

const getStudentFromData = (data) => {
  return data['data']
}

const getStudyRightFromData = (data) => {
  const info = data['info']['data']
  const details = data['elements']['data']
  if (details.length == 0) return null

  let studyRight = {
    studyRightId: info[1] != null ? info[1] : 0,
    organisation: info[2],
    priorityCode: info[3] != null ? info[3] : 0,
    extentCode: info[4] != null ? info[4] : 0,
    givenDate: info[5],
    startDate: info[6],
    studyStartDate: info[7],
    cancelDate: info[8],
    endDate: info[9],
    cangelOrganisation: info[10],
    graduated: info[11],
    highLevelName: details[0][4] != null ? details[0][4] : details[0][2]
  }
  if (details.length > 1 && details[details.length - 1][4] != null) {
    studyRight.highLevelName += ', ' + details[details.length - 1][4]
  }
  return studyRight
}

const getOrganisationFromData = (data) => {
  let organisation = []
  organisation['code'] = data['data'][1]
  organisation['name'] = data['data'][4] != null ? data['data'][4] : data['data'][2]
  return organisation
}

const getCourseCreditsFromData = (data) => {
  let courseCredits = []
  let course
  data['data'].forEach((courseData) => {
    course = {
      credits: courseData[3],
      grade: courseData[4],
      status: courseData[5],
      statusCode: courseData[6],
      ordering: courseData[7],
      courseInstance: {
        date: courseData[0],
        course: {
          courseCode: courseData[1],
          courseName: courseData[2]
        }
      }
    }
    courseCredits.push(course)
    course = []
  })
  return courseCredits
}

const getStudentNumbersFromProgramData = (data) => {
  let studentNumbers = []
  data['data'].forEach((student) => {
    studentNumbers.push(student[1])
  })
  return studentNumbers
}

module.exports = {
  getStudentFromData, getStudyRightIdStrings, getStudyRightFromData,
  getOrganisationFromData, getCourseCreditsFromData, getStudentNumbersFromProgramData
}