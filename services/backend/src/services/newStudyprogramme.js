const sequelize = require('sequelize')
const { Op } = sequelize
const {
  Credit,
  Course,
  Organization,
  Studyright,
  StudyrightElement,
  ElementDetail,
  Transfer,
  Student,
} = require('../models')
const { ThesisCourse } = require('../models/models_kone')
const { formatStudyright } = require('./studyprogrammeHelpers')

const startedStudyrights = async (studytrack, since) =>
  await Studyright.findAll({
    include: {
      model: StudyrightElement,
      required: true,
      include: {
        model: ElementDetail,
        required: true,
        where: {
          code: studytrack,
        },
      },
    },
    where: {
      studystartdate: {
        [Op.gte]: since,
      },
    },
  })

const graduatedStudyRights = async (studytrack, since) =>
  await Studyright.findAll({
    include: {
      model: StudyrightElement,
      required: true,
      include: {
        model: ElementDetail,
        required: true,
        where: {
          code: studytrack,
        },
      },
    },
    where: {
      graduated: 1,
      enddate: {
        [Op.gte]: since,
      },
    },
  })

const cancelledStudyRights = async (studytrack, since) => {
  return await Studyright.findAll({
    include: {
      model: StudyrightElement,
      required: true,
      where: {
        code: {
          [Op.eq]: studytrack,
        },
      },
    },
    where: {
      canceldate: {
        [Op.gte]: since,
      },
    },
  })
}

const transfersAway = async (studytrack, since) => {
  return await Transfer.findAll({
    where: {
      transferdate: {
        [Op.gte]: since,
      },
      sourcecode: studytrack,
    },
    distinct: true,
    col: 'studentnumber',
  })
}

const transfersTo = async (studytrack, since) => {
  return await Transfer.findAll({
    where: {
      transferdate: {
        [Op.gte]: since,
      },
      targetcode: studytrack,
    },
    distinct: true,
    col: 'studentnumber',
  })
}

const getProgrammesStudents = async studyprogramme =>
  (
    await Studyright.findAll({
      attributes: ['studyrightid', 'studystartdate', 'enddate', 'graduated', 'prioritycode', 'extentcode'],
      include: [
        {
          model: StudyrightElement,
          required: true,
          where: {
            code: {
              [Op.in]: [studyprogramme],
            },
          },
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
    })
  ).map(formatStudyright)

const getCreditsForStudyProgramme = async (provider, since) =>
  await Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'student_studentnumber'],
    include: {
      model: Course,
      attributes: ['code'],
      required: true,
      where: {
        is_study_module: false,
      },
      include: {
        model: Organization,
        required: true,
        where: {
          code: provider,
        },
      },
    },
    where: {
      credittypecode: {
        [Op.notIn]: [10, 9, 7],
      },
      isStudyModule: {
        [Op.not]: true,
      },
      attainment_date: {
        [Op.gte]: since,
      },
    },
  })

const getTransferredCredits = async (provider, since) =>
  await Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'credittypecode', 'student_studentnumber'],
    include: {
      model: Course,
      attributes: ['code'],
      required: true,
      where: {
        is_study_module: false,
      },
      include: {
        model: Organization,
        required: true,
        where: {
          code: provider,
        },
      },
    },
    where: {
      credittypecode: {
        [Op.eq]: [9],
      },
      attainment_date: {
        [Op.gte]: since,
      },
    },
  })

const getThesisCredits = async (studyprogramme, since) => {
  const thesiscourses = await ThesisCourse.findAll({
    where: {
      programmeCode: studyprogramme,
    },
  })
  return await Credit.findAll({
    include: {
      model: Course,
      required: true,
      distinct: true,
      col: 'student_studentnumber',
      where: {
        code: {
          [Op.in]: thesiscourses.map(tc => tc.courseCode),
        },
      },
    },
    where: {
      credittypecode: {
        [Op.eq]: 4,
      },
      attainment_date: {
        [Op.gte]: since,
      },
    },
  })
}

module.exports = {
  startedStudyrights,
  graduatedStudyRights,
  cancelledStudyRights,
  transfersAway,
  transfersTo,
  getProgrammesStudents,
  getCreditsForStudyProgramme,
  getTransferredCredits,
  getThesisCredits,
}
