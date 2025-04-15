import { Op } from 'sequelize'

import { SISStudyRight, SISStudyRightElement } from '../../models'
import { ExtentCode } from '../../types'
import { hasTransferredFromOrToProgramme } from '../studyProgramme/studyProgrammeHelpers'

const exchangeStudents = [ExtentCode.EXCHANGE_STUDIES, ExtentCode.EXCHANGE_STUDIES_POSTGRADUATE]

const nondegreeStudents = [
  ExtentCode.CONTINUING_EDUCATION,
  ExtentCode.OPEN_UNIVERSITY_STUDIES,
  ExtentCode.NON_DEGREE_PEGAGOGICAL_STUDIES_FOR_TEACHERS,
  ExtentCode.CONTRACT_TRAINING,
  ExtentCode.SPECIALIZATION_STUDIES,
  ExtentCode.NON_DEGREE_PROGRAMME_FOR_SPECIAL_EDUCATION_TEACHERS,
  ExtentCode.SPECIALIST_TRAINING_IN_MEDICINE_AND_DENTISTRY,
  ExtentCode.NON_DEGREE_STUDIES,
  ExtentCode.SUMMER_AND_WINTER_SCHOOL,
]

type StudentStudyRights = Pick<SISStudyRight, 'studentNumber' | 'studyRightElements'> & {
  studyRightElements: Array<Pick<SISStudyRightElement, 'code' | 'endDate' | 'startDate' | 'phase'>>
}

export const getStudentNumbersWithAllStudyRightElements = async ({
  studyRights,
  startDate,
  endDate,
  includeExchangeStudents,
  includeNondegreeStudents,
  includeTransferredOutStudents,
}) => {
  const filteredExtents = [
    ExtentCode.STUDIES_FOR_SECONDARY_SCHOOL_STUDENTS,
    ...(!includeExchangeStudents ? exchangeStudents : []),
    ...(!includeNondegreeStudents ? nondegreeStudents : []),
  ] as const

  const studyRightIds: Array<Pick<SISStudyRight, 'id'>> = await SISStudyRight.findAll({
    attributes: ['id'],
    include: {
      model: SISStudyRightElement,
      attributes: [],
      where: {
        code: { [Op.in]: studyRights },
        startDate: { [Op.gte]: startDate, [Op.lt]: endDate },
      },
    },
    where: {
      extentCode: { [Op.notIn]: filteredExtents },
    },
    raw: true,
  })

  const studentsStudyRights: Array<StudentStudyRights> = (
    await SISStudyRight.findAll({
      attributes: ['studentNumber'],
      include: {
        model: SISStudyRightElement,
        as: 'studyRightElements',
        attributes: ['code', 'endDate', 'startDate', 'phase'],
      },
      where: {
        id: {
          [Op.in]: studyRightIds.map(({ id }) => id),
        },
      },
    })
  ).map(studyRight => studyRight.toJSON())

  return studentsStudyRights
    .filter(student => {
      if (includeTransferredOutStudents) return true

      // NOTE: We know that this will always return a value because of the first query in the function
      const element = student.studyRightElements.find(element => studyRights.includes(element.code))!
      const [hasTransferredFromProgramme, _] = hasTransferredFromOrToProgramme(student, element)

      return !hasTransferredFromProgramme
    })
    .map(({ studentNumber }) => studentNumber)
}
