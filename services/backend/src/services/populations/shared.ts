import { orderBy } from 'lodash-es'
import { Op } from 'sequelize'

import { Name, DegreeProgrammeType } from '@oodikone/shared/types'
import { SISStudyRightElementModel, CourseModel } from '../../models'
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
export const getCurriculumVersion = (curriculumPeriodId: string | undefined) => {
  if (!curriculumPeriodId) {
    return null
  }
  const versionNumber = parseInt(curriculumPeriodId.slice(-2), 10)
  const year = versionNumber + 1949
  const startYear = Math.floor((year - 1) / 3) * 3 + 1
  const endYear = startYear + 3
  const curriculumVersion = `${startYear}-${endYear}`
  return curriculumVersion
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

export const getCourses = (courses: string[]): Promise<Array<Pick<CourseModel, 'code' | 'name' | 'substitutions'>>> =>
  CourseModel.findAll({
    attributes: ['code', 'name', 'substitutions'],
    where: {
      code: { [Op.in]: courses },
    },
    raw: true,
  })
