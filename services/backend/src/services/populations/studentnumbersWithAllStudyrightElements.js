const { Op } = require('sequelize')
const { TagStudent } = require('../../models/models_kone')
const { StudyrightElement, ElementDetail, Studyright, Transfer, Student } = require('../../models')
const {
  dbConnections: { sequelize },
} = require('../../database/connection')
const { count } = require('./shared')
const { sortBy } = require('lodash')

const studentnumbersWithAllStudyrightElements = async ({
  studyRights,
  startDate,
  endDate,
  exchangeStudents,
  nondegreeStudents,
  transferredOutStudents,
  tag,
  transferredToStudents,
  graduatedStudents,
}) => {
  const filteredExtents = [16] // always filter out secondary subject students
  if (!exchangeStudents) {
    filteredExtents.push(7, 34)
  }
  if (!nondegreeStudents) {
    filteredExtents.push(6, 9, 13, 14, 18, 22, 23, 99)
  }

  let studyrightWhere = {
    extentcode: {
      [Op.notIn]: filteredExtents,
    },
    prioritycode: {
      [Op.not]: 6,
    },
  }

  let studentWhere = {}
  if (tag) {
    const taggedStudentnumbers = await TagStudent.findAll({
      attributes: ['studentnumber'],
      where: {
        tag_id: tag,
      },
    })
    studentWhere.where = {
      student_studentnumber: {
        [Op.in]: taggedStudentnumbers.map(sn => sn.studentnumber),
      },
    }
  }

  const students = await Studyright.findAll({
    attributes: ['student_studentnumber', 'graduated', 'enddate'],
    include: {
      model: StudyrightElement,
      attributes: [],
      required: true,
      where: {
        code: {
          [Op.in]: studyRights,
        },
      },
      include: {
        model: ElementDetail,
        attributes: [],
      },
    },
    group: [sequelize.col('studyright.studyrightid')],
    where: {
      [Op.or]: [
        {
          ['$studyright_elements->element_detail.type$']: {
            [Op.ne]: 20,
          },
        },
        sequelize.where(
          sequelize.fn(
            'GREATEST',
            sequelize.col('studyright_elements.startdate'),
            sequelize.col('studyright.startdate')
          ),
          {
            [Op.between]: [startDate, endDate],
          }
        ),
      ],
      ...studyrightWhere,
    },
    ...studentWhere,
    having: count('studyright_elements.code', studyRights.length, true),
    raw: true,
  })

  let studentnumbers = [...new Set(students.map(s => s.student_studentnumber))]
  // bit hacky solution, but this is used to filter out studentnumbers who have since changed studytracks
  const rights = await Studyright.findAll({
    attributes: ['studyrightid'],
    where: {
      studentStudentnumber: {
        [Op.in]: studentnumbers,
      },
    },
    include: {
      attributes: [],
      model: StudyrightElement,
      where: {
        code: {
          [Op.in]: studyRights,
        },
      },
    },
    group: ['studyright.studyrightid'],
    having: count('studyright_elements.id', studyRights.length, true),
    raw: true,
  })

  // bit hacky solution, but this is used to filter out studentnumbers who have since changed studytracks
  const allStudytracksForStudents = await StudyrightElement.findAll({
    where: {
      studyrightid: {
        [Op.in]: rights.map(r => r.studyrightid),
      },
    },
    include: {
      model: ElementDetail,
      where: {
        type: {
          [Op.eq]: 30,
        },
      },
    },
    raw: true,
  })

  const studentNumberToSrElementMap = allStudytracksForStudents.reduce((obj, cur) => {
    if (!obj[cur.studentnumber]) obj[cur.studentnumber] = []
    obj[cur.studentnumber].push(cur)
    return obj
  }, {})

  const formattedStudytracks = studentnumbers.reduce((acc, curr) => {
    acc[curr] = studentNumberToSrElementMap[curr]
    return acc
  }, {})

  // Take the newest studytrack primarily by latest starting date in the track, secondarily by the latest enddate
  const filteredStudentnumbers = studentnumbers.filter(studentnumber => {
    const newestStudytrack = sortBy(formattedStudytracks[studentnumber], ['startdate', 'enddate']).reverse()[0]
    if (!newestStudytrack) return false
    return studyRights.includes(newestStudytrack.code)
  })

  // Use the filtered list, if the search includes studytracks
  // Then the studyrights length is > 1, which means that there is [studyright, studytrack].
  // When searching only for studyprogramme, there is [studyright]
  let studentnumberlist = studyRights.length > 1 ? filteredStudentnumbers : studentnumbers

  // fetch students that have transferred out of the programme and filter out these studentnumbers
  if (!transferredOutStudents) {
    const transfersOut = (
      await Transfer.findAll({
        attributes: ['studentnumber'],
        where: {
          sourcecode: {
            [Op.in]: studyRights,
          },
          transferdate: {
            [Op.gt]: startDate,
          },
          studentnumber: {
            [Op.in]: studentnumberlist,
          },
        },
        raw: true,
      })
    ).map(s => s.studentnumber)

    studentnumberlist = studentnumberlist.filter(sn => !transfersOut.includes(sn))
  }

  // fetch students that have transferred to the programme and filter out these studentnumbers
  if (!transferredToStudents) {
    const transfersTo = (
      await Transfer.findAll({
        attributes: ['studentnumber'],
        where: {
          targetcode: {
            [Op.in]: studyRights,
          },
          transferdate: {
            [Op.gt]: startDate,
          },
          studentnumber: {
            [Op.in]: studentnumberlist,
          },
        },
        raw: true,
      })
    ).map(s => s.studentnumber)
    studentnumberlist = studentnumberlist.filter(sn => !transfersTo.includes(sn))
  }

  // fetch students that have graduated from the programme and filter out these studentnumbers
  if (!graduatedStudents) {
    const graduated = (
      await Student.findAll({
        attributes: ['studentnumber'],
        include: [
          {
            model: Studyright,
            include: [
              {
                model: StudyrightElement,
                required: true,
                where: {
                  code: {
                    [Op.in]: studyRights,
                  },
                },
              },
            ],
            where: {
              graduated: 1,
            },
          },
        ],
        where: {
          studentnumber: {
            [Op.in]: studentnumbers,
          },
        },
      })
    ).map(s => s.studentnumber)
    studentnumberlist = studentnumberlist.filter(sn => !graduated.includes(sn))
  }

  return studentnumberlist
}

module.exports = {
  studentnumbersWithAllStudyrightElements,
}
