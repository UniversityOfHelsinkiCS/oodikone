import axios from 'axios'
import { Request, Response, Router } from 'express'

import { Release } from '@oodikone/shared/types'
import { isDev } from '../config'

const router = Router()

const changelog: { data?: Release[] } = {}

export type ChangelogResBody = Release[]

router.get<never, ChangelogResBody>('/', async (_req: Request, res: Response) => {
  if (changelog.data) {
    return res.status(200).send(changelog.data)
  }
  if (isDev) {
    const fakeRelease: Release[] = [
      {
        description: '**Feature 1**\n- Added a fancy new feature \n\n**Feature 2**\n- Fixed a bug\n- Fixed another bug',
        title: 'Release 3',
        time: new Date().toISOString(),
        version: '0.0.3',
      },
      {
        description: "Let's not spam the GitHub API in development!",
        title: 'Release 2',
        time: new Date().toISOString(),
        version: '0.0.2',
      },
      {
        description: 'This release should not be visible on the frontpage',
        title: 'Release 1',
        time: new Date().toISOString(),
        version: '0.0.1',
      },
    ]
    return res.status(200).json(fakeRelease)
  }
  const response = await axios.get('https://api.github.com/repos/UniversityOfHelsinkiCS/oodikone/releases')
  const releasesFromAPI: Release[] = response.data.map((release: Record<string, any>) => ({
    description: release.body,
    time: release.published_at,
    title: release.name,
    version: release.tag_name,
  }))
  changelog.data = releasesFromAPI
  res.status(200).json(releasesFromAPI)
})

export default router
