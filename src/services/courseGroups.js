const EP_TEACHERS = ['017715', '019051', '053532', '028579', '036199', '083257', '089822', '128474']
const KP_TEACHERS = ['032147', '012926', '066993']

const getTeachersForCourseGroup = courseGroupId => {
  if (courseGroupId === 1) {
    return EP_TEACHERS
  }

  if (courseGroupId === 2) {
    return KP_TEACHERS
  }
}

module.exports = {
  getTeachersForCourseGroup
}
