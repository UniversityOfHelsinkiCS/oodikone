import { Request, Response, Router } from 'express'

import { getProvidersOfFaculty, isFaculty } from '../services/organizations'
import { getTeachersBySearchTerm, getTeacherStatistics, getYearlyStatistics } from '../services/teachers'
import { CategoryID, getTeacherStats, findAndSaveTeachers, getCategoriesAndYears } from '../services/teachers/top'
import { mapToProviders } from '../shared/util/mapToProviders'
import { getFullStudyProgrammeRights, splitByEmptySpace } from '../util'

const router = Router()

interface GetTeachersRequest extends Request {
  query: {
    searchTerm: string
  }
}

router.get('/', async (req: GetTeachersRequest, res: Response) => {
  const { searchTerm } = req.query
  if (!searchTerm) {
    return res.status(400).json({ error: 'Search term missing' })
  }

  const trimmedSearchTerm = searchTerm.trim()
  const stringSearchTermIsInvalid = !splitByEmptySpace(trimmedSearchTerm).find(searchTerm => searchTerm.length >= 4)
  const numericSearchTermIsInvalid = !Number.isNaN(Number(trimmedSearchTerm)) && trimmedSearchTerm.length < 6
  if (stringSearchTermIsInvalid || numericSearchTermIsInvalid) {
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

router.get('/top', async (req: GetTopTeachersRequest, res: Response) => {
  const { yearcode, category = CategoryID.ALL } = req.query
  if (!yearcode) {
    return res.status(422).send('Missing required yearcode query param')
  }

  const result = await getTeacherStats(category, Number(yearcode))
  res.json(result)
})

interface PostTopTeachersRequest extends Request {
  body: {
    startyearcode?: string
    endyearcode?: string
  }
}

router.post('/top', async (req: PostTopTeachersRequest, res: Response) => {
  const { startyearcode, endyearcode } = req.body
  const endYear = endyearcode ? Number(endyearcode) : undefined
  const startYear = startyearcode ? Number(startyearcode) : undefined
  res.status(200).end()
  await findAndSaveTeachers(endYear, startYear)
})

router.get('/top/categories', async (_req: Request, res: Response) => {
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
  const { roles, programmeRights } = req.user
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const { providers, semesterStart, semesterEnd } = req.query
  if (!providers || !semesterStart) {
    return res.status(422).send('Missing required query parameters')
  }

  const providerRights = mapToProviders(fullStudyProgrammeRights)
  if (!(providers.every(provider => providerRights.includes(provider)) || roles.includes('admin'))) {
    return res.status(403).send('You do not have permission to see this data')
  }

  /* 
  HowTo: 
    
    #1: here we need rights linked to an organizational entity, not a degree programme.
    To ponder upon: should there be an option in Oodikone to add rights based on 
    an organization (laitos, tiedekunta). Perhaps there is in JAMI?

    #2: if this is to be done using rights associated with degree programmes, one should 
    parse a list of courses linked to a degree programme using the structure
    in the degree programme "rules". The results of these courses could be shown to the user.
  */
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

router.get('/:id', async (req: GetTeacherByIdRequest, res: Response) => {
  const { id } = req.params
  const result = await getTeacherStatistics(id)
  if (!result) {
    return res.status(404).send()
  }
  res.json(result)
})

export default router
