const { Credit, Enrollment, Studyright, Student, Course } = require('../../models')
const { OpenUniPopulationSearch } = require('../../models/models_kone')
const {
  mapOpenCredits,
  mapOpenEnrollments,
  mapStundentInfo,
  mapStudyRights,
  mapCourseInfo,
} = require('./openUniHelpers')
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

const getCourseNames = async courseCodes =>
  (
    await Course.findAll({
      attributes: ['code', 'name'],
      where: {
        code: {
          [Op.in]: courseCodes,
        },
      },
    })
  ).map(mapCourseInfo)

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

const getOpenUniSearchesByUser = async userId => {
  return await OpenUniPopulationSearch.findAll({
    where: {
      userId,
    },
  })
}

const createOpenUniPopulationSearch = async (userId, name, courseCodes) => {
  return await OpenUniPopulationSearch.create({
    userId,
    name,
    courseCodes,
  })
}

const updateOpenUniPopulationSearch = async (userId, id, courseCodes) => {
  const searchToUpdate = await OpenUniPopulationSearch.findOne({
    where: {
      userId: userId,
      id: id,
    },
  })

  if (!searchToUpdate) return null
  return await searchToUpdate.update({ courseCodes })
}

const deleteOpenUniSearch = async (userId, id) => {
  return await OpenUniPopulationSearch.destroy({
    where: {
      userId: userId,
      id: id,
    },
  })
}

module.exports = {
  getCredits,
  getEnrollments,
  getStudyRights,
  getStudentInfo,
  getCourseNames,
  getOpenUniSearchesByUser,
  createOpenUniPopulationSearch,
  updateOpenUniPopulationSearch,
  deleteOpenUniSearch,
}
