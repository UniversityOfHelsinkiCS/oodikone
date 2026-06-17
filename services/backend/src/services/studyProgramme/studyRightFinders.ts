import { col, fn, Includeable, Op } from 'sequelize'

import { SISStudyRight } from '@oodikone/shared/models'
import { CreditTypeCode } from '@oodikone/shared/types'
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

  const studyRightIds = (
    await SISStudyRightModel.findAll({
      attributes: ['id'],
      include: {
        model: SISStudyRightElementModel,
        as: 'studyRightElements',
        attributes: [],
        where,
      },
      raw: true,
    })
  ).map(sr => sr.id)

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
      attributes: ['id', 'extentCode', 'semesterEnrollments', 'studentNumber', 'transferInfo'],
      include,
      where: {
        id: {
          [Op.in]: studyRightIds,
        },
      },
    })
  ).map(studyRight => studyRight.toJSON<SISStudyRight>())
}

export const getStudyTracksForProgramme = async (studyProgramme: string) => {
  const result: Array<Pick<SISStudyRightElementModel, 'studyTrack'>> = await SISStudyRightElementModel.findAll({
    attributes: [[fn('DISTINCT', col('study_track')), 'studyTrack']],
    where: {
      code: studyProgramme,
      study_track: { [Op.ne]: null },
    },
    raw: true,
  })

  return Object.assign(
    { [studyProgramme]: 'All students of the programme' },
    Object.fromEntries(result.map(({ studyTrack }) => [studyTrack!.code, studyTrack!.name]))
  )
}

export const getSISStudyRightsOfStudents = async (
  studentNumbers: string[]
): Promise<
  Pick<SISStudyRight, 'id' | 'studentNumber' | 'extentCode' | 'semesterEnrollments' | 'startDate' | 'endDate'>[]
> =>
  (
    await SISStudyRightModel.findAll({
      attributes: ['id', 'studentNumber', 'extentCode', 'semesterEnrollments', 'startDate', 'endDate'],
      where: {
        studentNumber: {
          [Op.in]: studentNumbers,
        },
      },
    })
  ).map(studyRight => studyRight.toJSON())
