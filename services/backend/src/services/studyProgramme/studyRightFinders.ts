import { col, fn, Includeable, Op } from 'sequelize'

import { Name, CreditTypeCode } from '@oodikone/shared/types'
import { StudentModel, SISStudyRightModel, SISStudyRightElementModel, CreditModel } from '../../models'

export const getStudyRightsInProgramme = async (
  programmeCode: string,
  onlyGraduated: boolean,
  includeStudentsAndCredits = false
) => {
  const where: Record<string, any> = { code: programmeCode }
  if (onlyGraduated) {
    where.graduated = true
  }

  const studyRights = await SISStudyRightModel.findAll({
    attributes: ['id'],
    include: {
      model: SISStudyRightElementModel,
      as: 'studyRightElements',
      attributes: [],
      where,
    },
  })

  const include: Includeable[] = [
    {
      model: SISStudyRightElementModel,
      as: 'studyRightElements',
      attributes: ['phase', 'code', 'name', 'startDate', 'endDate', 'graduated', 'studyTrack'],
    },
  ]

  if (includeStudentsAndCredits) {
    include.push({
      model: StudentModel,
      attributes: ['gender_code', 'citizenships'],
      include: [
        {
          model: CreditModel,
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
    await SISStudyRightModel.findAll({
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
  const result: Array<Pick<SISStudyRightElementModel, 'studyTrack'>> = await SISStudyRightElementModel.findAll({
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
    await SISStudyRightModel.findAll({
      where: {
        studentNumber: {
          [Op.in]: studentNumbers,
        },
      },
      attributes: ['id', 'studentNumber', 'extentCode', 'semesterEnrollments', 'startDate', 'endDate'],
    })
  ).map(studyRight => studyRight.toJSON())
}
