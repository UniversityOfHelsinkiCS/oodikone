import { Op } from 'sequelize'

import { SISStudyRight, SISStudyRightElement } from '../../models'
import { ExtentCode } from '../../types'
import { hasTransferredFromOrToProgramme } from '../studyProgramme/studyProgrammeHelpers'

export const getStudentNumbersWithAllStudyRightElements = async ({
  studyRights,
  startDate,
  endDate,
  exchangeStudents,
  nondegreeStudents,
  transferredOutStudents,
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
      ExtentCode.NON_DEGREE_STUDIES,
      ExtentCode.SUMMER_AND_WINTER_SCHOOL
    )
  }

  const studyRightIds = (
    await SISStudyRight.findAll({
      attributes: ['id'],
      include: {
        model: SISStudyRightElement,
        attributes: [],
        where: {
          code: {
            [Op.in]: studyRights,
          },
          startDate: {
            [Op.gte]: startDate,
            [Op.lt]: endDate,
          },
        },
      },
      where: {
        extentCode: {
          [Op.notIn]: filteredExtents,
        },
      },
      raw: true,
    })
  ).map(studyRight => studyRight.id)

  const studentsStudyRights = (
    await SISStudyRight.findAll({
      attributes: ['studentNumber'],
      include: {
        model: SISStudyRightElement,
        as: 'studyRightElements',
        attributes: ['code', 'endDate', 'startDate', 'phase'],
      },
      where: {
        id: {
          [Op.in]: studyRightIds,
        },
      },
    })
  ).map(studyRight => studyRight.toJSON())

  const studentNumbers = studentsStudyRights.map(student => student.studentNumber)

  if (transferredOutStudents) {
    return studentNumbers
  }

  const transferredStudentNumbers = studentsStudyRights.reduce<string[]>((acc, student) => {
    const [hasTransferredFromProgramme] = hasTransferredFromOrToProgramme(
      student,
      student.studyRightElements.find(element => studyRights.includes(element.code))!
    )
    if (hasTransferredFromProgramme) {
      acc.push(student.studentNumber)
    }
    return acc
  }, [])

  return studentNumbers.filter(studentNumber => !transferredStudentNumbers.includes(studentNumber))
}
