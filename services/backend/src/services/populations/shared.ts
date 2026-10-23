import { orderBy } from 'lodash-es'
import { Op } from 'sequelize'

import { CourseStats } from '@oodikone/shared/routes/populations'
import { CurriculumPeriod } from '@oodikone/shared/models'
import { Name, DegreeProgrammeType } from '@oodikone/shared/types'
import { CurriculumPeriodModel, SISStudyRightElementModel, CourseModel } from '../../models'
import { SemesterStart } from '../../util/semester'

type QueryParams = {
  semesters: string[]
  years: string[]
}

type ParsedQueryParams = {
  startDate: string
  endDate: string
}

export const parseDateRangeFromParams = (query: QueryParams): ParsedQueryParams => {
  const { semesters, years } = query
  const startingYear = Math.min(...years.map(y => +y))
  const endingYear = Math.max(...years.map(y => +y))

  const hasFall = semesters.includes('FALL')
  const hasSpring = semesters.includes('SPRING')

  const startDate = hasFall
    ? new Date(`${startingYear}-${SemesterStart.FALL}`).toISOString()
    : new Date(`${startingYear + 1}-${SemesterStart.SPRING}`).toISOString()

  const endDate = hasSpring
    ? new Date(`${endingYear + 1}-${SemesterStart.FALL}`).toISOString()
    : new Date(`${endingYear + 1}-${SemesterStart.SPRING}`).toISOString()

  return { startDate, endDate }
}

type CurriculumPeriodDates = Pick<CurriculumPeriod, 'startDate' | 'endDate'>

export const getCurriculumPeriodsById = async (): Promise<Map<string, CurriculumPeriodDates>> => {
  const curriculumPeriods = await CurriculumPeriodModel.findAll({
    attributes: ['id', 'startDate', 'endDate'],
    raw: true,
  })
  return new Map(curriculumPeriods.map(({ id, startDate, endDate }) => [id, { startDate, endDate }]))
}

export const getCurriculumVersion = (
  curriculumPeriodIds: string[] | undefined,
  curriculumPeriodsById: Map<string, CurriculumPeriodDates>
) => {
  const curriculumPeriods = (curriculumPeriodIds ?? [])
    .map(id => curriculumPeriodsById.get(id))
    .filter(period => period !== undefined)
  if (!curriculumPeriods.length) {
    return null
  }
  const startYear = Math.min(...curriculumPeriods.map(({ startDate }) => new Date(startDate).getFullYear()))
  const endYear = Math.max(...curriculumPeriods.map(({ endDate }) => new Date(endDate).getFullYear()))
  return `${startYear}-${endYear}`
}

export const getOptionsForStudents = (
  studyRightElementsForStudyRight: SISStudyRightElementModel[],
  degreeProgrammeType: DegreeProgrammeType | null
): Map<string, Name> => {
  if (
    degreeProgrammeType &&
    ![DegreeProgrammeType.BACHELOR, DegreeProgrammeType.MASTER].includes(degreeProgrammeType)
  ) {
    return new Map()
  }

  const levelIsMasters = degreeProgrammeType === DegreeProgrammeType.MASTER
  const filter = levelIsMasters ? DegreeProgrammeType.BACHELOR : DegreeProgrammeType.MASTER

  const optionMap = new Map()
  for (const { studyRight } of studyRightElementsForStudyRight) {
    const [latestProgramme] = orderBy(
      studyRight.studyRightElements.filter(element => element.degreeProgrammeType === filter),
      [levelIsMasters ? 'endDate' : 'startDate'],
      [levelIsMasters ? 'desc' : 'asc']
    )

    if (latestProgramme?.name === undefined) continue

    optionMap.set(studyRight.studentNumber, latestProgramme.name)
  }

  return optionMap
}

export const getCourseGroupIds = (courseIds: string[]): Promise<Array<Pick<CourseStats, 'id' | 'groupId'>>> =>
  CourseModel.findAll({
    attributes: ['id', 'groupId'],
    where: {
      id: { [Op.in]: courseIds },
    },
    raw: true,
  })
