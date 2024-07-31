import { sortBy } from 'lodash'
import { Op } from 'sequelize'

import { dbConnections } from '../../database/connection'
import { ElementDetail, Student, Studyright, StudyrightElement, Transfer } from '../../models'
import { TagStudent } from '../../models/kone'
import { ElementDetailType, ExtentCode, PriorityCode } from '../../types'
import { count } from './shared'

const { sequelize } = dbConnections

export const getStudentNumbersWithAllStudyRightElements = async ({
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
  const filteredExtents = [ExtentCode.STUDIES_FOR_SECONDARY_SCHOOL_STUDENTS]
  if (!exchangeStudents) {
    filteredExtents.push(ExtentCode.EXCHANGE_STUDIES, ExtentCode.EXCHANGE_STUDIES_POSTGRADUATE)
  }
  if (!nondegreeStudents) {
    filteredExtents.push(
      ExtentCode.CONTINUING_EDUCATION,
      ExtentCode.OPEN_UNIVERSITY_STUDIES,
      ExtentCode.NON_DEGREE_PEGAGOGICAL_STUDIES_FOR_TEACHERS,
      ExtentCode.CONTRACT_TRAINING,
      ExtentCode.SPECIALIZATION_STUDIES,
      ExtentCode.NON_DEGREE_PROGRAMME_FOR_SPECIAL_EDUCATION_TEACHERS,
      ExtentCode.SPECIALIST_TRAINING_IN_MEDICINE_AND_DENTISTRY,
      ExtentCode.NON_DEGREE_STUDIES
    )
  }

  const studyrightWhere = {
    extentcode: {
      [Op.notIn]: filteredExtents,
    },
    prioritycode: {
      [Op.not]: PriorityCode.OPTION,
    },
  }

  const studentWhere: Record<string, any> = {}
  if (tag) {
    const taggedStudentnumbers = await TagStudent.findAll({
      attributes: ['studentnumber'],
      where: {
        tag_id: tag,
      },
    })
    studentWhere.where = {
      student_studentnumber: {
        [Op.in]: taggedStudentnumbers.map(student => student.studentnumber),
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
      include: [
        {
          model: ElementDetail,
          attributes: [],
        },
      ],
    },
    where: {
      [Op.or]: [
        {
          '$studyright_elements->element_detail.type$': {
            [Op.ne]: ElementDetailType.PROGRAMME,
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
    group: [sequelize.col('studyright.studyrightid')],
    having: count('studyright_elements.code', studyRights.length, true),
    raw: true,
  })

  const studentNumbers = [...new Set(students.map(student => student.student_studentnumber))]
  const rights = await Studyright.findAll({
    attributes: ['studyrightid'],
    where: {
      student_studentnumber: {
        [Op.in]: studentNumbers,
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
        [Op.in]: rights.map(studyRight => studyRight.studyrightid),
      },
    },
    include: {
      model: ElementDetail,
      where: {
        type: {
          [Op.eq]: ElementDetailType.MODULE,
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

  const formattedStudytracks = studentNumbers.reduce((acc, curr) => {
    acc[curr] = studentNumberToSrElementMap[curr]
    return acc
  }, {})

  // Take the newest studytrack primarily by latest starting date in the track, secondarily by the latest enddate
  const filteredStudentnumbers = studentNumbers.filter(studentNumber => {
    const newestStudytrack = sortBy(formattedStudytracks[studentNumber], ['startdate', 'enddate']).reverse()[0]
    if (!newestStudytrack) return false
    return studyRights.includes(newestStudytrack.code)
  })

  // Use the filtered list, if the search includes studytracks
  // Then the studyrights length is > 1, which means that there is [studyright, studytrack].
  // When searching only for studyprogramme, there is [studyright]
  let studentNumberList = studyRights.length > 1 ? filteredStudentnumbers : studentNumbers

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
            [Op.in]: studentNumberList,
          },
        },
        raw: true,
      })
    ).map(student => student.studentnumber)

    studentNumberList = studentNumberList.filter(studentNumber => !transfersOut.includes(studentNumber))
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
            [Op.in]: studentNumberList,
          },
        },
        raw: true,
      })
    ).map(transfer => transfer.studentnumber)
    studentNumberList = studentNumberList.filter(studentNumber => !transfersTo.includes(studentNumber))
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
            [Op.in]: studentNumbers,
          },
        },
      })
    ).map(student => student.studentnumber)
    studentNumberList = studentNumberList.filter(studentNumber => !graduated.includes(studentNumber))
  }

  return studentNumberList
}
