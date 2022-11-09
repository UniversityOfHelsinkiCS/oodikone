const { Credit, Enrollment, Studyright, Student } = require('../../models')
const { mapOpenCredits, mapOpenEnrollments, mapStundentInfo, mapStudyRights } = require('./openUniHelpers')
const { Op } = require('sequelize')

// 1. iteration: time is hardcoded. Check hyväksytty grades
const getCredits = async (courseCodes, startdate) =>
  (
    await Credit.findAll({
      where: {
        course_code: {
          [Op.in]: courseCodes,
        },
        is_open: true,
        grade: {
          [Op.in]: ['1', '2', '3', '4', '5', 'Hyv.'],
        },
        attainment_date: {
          [Op.gte]: startdate,
        },
      },
    })
  ).map(mapOpenCredits)

const getStudentInfo = async students =>
  (
    await Student.findAll({
      where: {
        studentnumber: {
          [Op.in]: students,
        },
      },
    })
  ).map(mapStundentInfo)

const getEnrollments = async (courseCodes, startdate, enddate) =>
  (
    await Enrollment.findAll({
      where: {
        course_code: {
          [Op.in]: courseCodes,
        },
        is_open: true,
        enrollment_date_time: {
          [Op.and]: {
            [Op.lte]: enddate,
            [Op.gte]: startdate,
          },
        },
      },
    })
  ).map(mapOpenEnrollments)

const getStudyRights = async students =>
  (
    await Studyright.findAll({
      include: [
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        student_studentnumber: {
          [Op.in]: students.length > 0 ? students : { [Op.not]: null },
        },
      },
    })
  ).map(mapStudyRights)

module.exports = { getCredits, getEnrollments, getStudyRights, getStudentInfo }
