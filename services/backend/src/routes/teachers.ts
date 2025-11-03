import { Request, Response, Router } from 'express'

import { mapToProviders, splitByEmptySpace } from '@oodikone/shared/util'
import { serviceProvider } from '../config'
import * as auth from '../middleware/auth'
import { getProvidersOfFaculty, isFaculty } from '../services/organizations'
import { getTeachersBySearchTerm, getTeacherStatistics, getYearlyStatistics } from '../services/teachers'
import { CategoryID, getTeacherStats, findAndSaveTeachers, getCategoriesAndYears } from '../services/teachers/top'
import { getFullStudyProgrammeRights, validateParamLength } from '../util'

const router = Router()

const iamGroupsGivingFullAccess = ['hy-dekaanit', 'hy-varadekaanit-opetus']

const fullAccessAuth = () =>
  serviceProvider === 'toska' ? auth.roles([], iamGroupsGivingFullAccess) : auth.roles(['teachers'])

interface GetTeachersRequest extends Request {
  query: {
    searchTerm: string
  }
}

router.get('/', fullAccessAuth(), async (req: GetTeachersRequest, res: Response) => {
  const { searchTerm } = req.query
  if (!searchTerm) {
    return res.status(400).json({ error: 'Search term missing' })
  }

  const trimmedSearchTerm = searchTerm.trim()
  const searchTermIsInvalid =
    !validateParamLength(trimmedSearchTerm, 4) &&
    !splitByEmptySpace(trimmedSearchTerm).find(searchTerm => searchTerm.length >= 4)
  if (searchTermIsInvalid) {
    return res.status(400).json({ error: 'Invalid search term' })
  }

  const result = await getTeachersBySearchTerm(trimmedSearchTerm)
  res.json(result)
})

interface GetTopTeachersRequest extends Request {
  query: {
    yearcode: string
    category?: string
  }
}

router.get('/top', fullAccessAuth(), async (req: GetTopTeachersRequest, res: Response) => {
  const { yearcode, category = CategoryID.ALL } = req.query
  if (!yearcode) {
    return res.status(422).send('Missing required yearcode query param')
  }

  const result = await getTeacherStats(category, Number(yearcode))
  if (result) {
    return res.json(result)
  }
  await findAndSaveTeachers(Number(yearcode), Number(yearcode))
  const updatedStats = await getTeacherStats(category, Number(yearcode))
  res.json(updatedStats)
})

interface PostTopTeachersRequest extends Request {
  body: {
    startyearcode?: string
    endyearcode?: string
  }
}

router.post('/top', auth.roles(['admin']), async (req: PostTopTeachersRequest, res: Response) => {
  const { startyearcode, endyearcode } = req.body
  const endYear = endyearcode ? Number(endyearcode) : undefined
  const startYear = startyearcode ? Number(startyearcode) : undefined
  res.status(200).end()
  await findAndSaveTeachers(endYear, startYear)
})

router.get('/top/categories', fullAccessAuth(), async (_req: Request, res: Response) => {
  const result = await getCategoriesAndYears()
  res.json(result)
})

interface GetTeacherStatsRequest extends Request {
  query: {
    providers?: string[]
    semesterStart?: string
    semesterEnd?: string
  }
}

router.get('/stats', async (req: GetTeacherStatsRequest, res: Response) => {
  const { roles, programmeRights, iamGroups } = req.user
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const { providers, semesterStart, semesterEnd } = req.query
  if (!providers || !semesterStart) {
    return res.status(422).send('Missing required query parameters')
  }

  const providerRights = mapToProviders(fullStudyProgrammeRights)
  if (
    !(
      (roles.includes('teachers') && providers.every(provider => providerRights.includes(provider))) ||
      roles.includes('admin') ||
      iamGroups.some(group => iamGroupsGivingFullAccess.includes(group))
    )
  ) {
    return res.status(403).send('You do not have permission to see this data')
  }

  // Combine provider list that may include programmes and faculties
  const parsedProvidersSet = new Set<string>()
  for (const provider of providers) {
    if (isFaculty(provider)) {
      const facultyProviders = await getProvidersOfFaculty(provider)
      for (const provider of facultyProviders) {
        parsedProvidersSet.add(provider)
      }
    } else {
      parsedProvidersSet.add(provider)
    }
  }
  const parsedProviders = Array.from(parsedProvidersSet)

  const result = await getYearlyStatistics(parsedProviders, Number(semesterStart), Number(semesterEnd))
  res.json(result)
})

interface GetTeacherByIdRequest extends Request {
  params: {
    id: string
  }
}

router.get('/:id', fullAccessAuth(), async (req: GetTeacherByIdRequest, res: Response) => {
  const { id } = req.params
  const result = await getTeacherStatistics(id)
  if (!result) {
    return res.status(404).send()
  }
  res.json(result)
})

export default router
