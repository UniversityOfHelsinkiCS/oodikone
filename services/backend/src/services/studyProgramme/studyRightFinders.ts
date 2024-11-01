import { col, fn, Includeable, Op } from 'sequelize'

import { Student, SISStudyRight, SISStudyRightElement, Credit } from '../../models'
import { Name } from '../../shared/types'
import { CreditTypeCode } from '../../types'

export const getStudyRightsInProgramme = async (
  programmeCode: string,
  onlyGraduated: boolean,
  includeStudentsAndCredits = false
) => {
  const where: Record<string, any> = { code: programmeCode }
  if (onlyGraduated) {
    where.graduated = true
  }

  const studyRights = await SISStudyRight.findAll({
    attributes: ['id'],
    include: {
      model: SISStudyRightElement,
      as: 'studyRightElements',
      attributes: [],
      where,
    },
  })

  const include: Includeable[] = [
    {
      model: SISStudyRightElement,
      as: 'studyRightElements',
      attributes: ['phase', 'code', 'name', 'startDate', 'endDate', 'graduated', 'studyTrack'],
    },
  ]

  if (includeStudentsAndCredits) {
    include.push({
      model: Student,
      attributes: ['gender_code', 'home_country_en'],
      include: [
        {
          model: Credit,
          attributes: ['attainment_date', 'credits'],
          where: {
            isStudyModule: false,
            credittypecode: {
              [Op.in]: [CreditTypeCode.PASSED, CreditTypeCode.APPROVED],
            },
          },
          required: false,
        },
      ],
    })
  }

  return (
    await SISStudyRight.findAll({
      attributes: ['id', 'extentCode', 'semesterEnrollments', 'studentNumber'],
      include,
      where: {
        id: {
          [Op.in]: studyRights.map(studyRight => studyRight.toJSON().id),
        },
      },
    })
  ).map(studyRight => studyRight.toJSON())
}

export const getStudyTracksForProgramme = async (studyProgramme: string) => {
  const result: Array<Pick<SISStudyRightElement, 'studyTrack'>> = await SISStudyRightElement.findAll({
    attributes: [[fn('DISTINCT', col('study_track')), 'studyTrack']],
    where: {
      code: studyProgramme,
    },
    raw: true,
  })

  return result
    .map(studyTrack => studyTrack.studyTrack)
    .filter(studyTrack => studyTrack != null)
    .reduce<Record<string, Name | 'All students of the programme'>>(
      (acc, track) => {
        acc[track.code] = track.name
        return acc
      },
      { [studyProgramme]: 'All students of the programme' }
    )
}

export const getSISStudyRightsOfStudents = async (studentNumbers: string[]) => {
  return (
    await SISStudyRight.findAll({
      where: {
        studentNumber: {
          [Op.in]: studentNumbers,
        },
      },
      attributes: ['id', 'studentNumber', 'extentCode', 'semesterEnrollments', 'startDate', 'endDate'],
    })
  ).map(studyRight => studyRight.toJSON())
}
