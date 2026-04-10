import { Router } from 'express'

import { Release } from '@oodikone/shared/types'
import { Fetchios } from '@oodikone/shared/util/fetchios'
import { isDev, isTest } from '../config'

const router = Router()

const changelog: { data?: Release[] } = {}

router.get<never, Release[]>('/', async (_, res) => {
  if (changelog.data) {
    return res.status(200).send(changelog.data)
  }

  if (isDev || isTest) {
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

    changelog.data = fakeRelease
    return res.status(200).json(fakeRelease)
  }

  const { data } = await Fetchios.get<Record<string, any>[]>(
    'https://api.github.com/repos/UniversityOfHelsinkiCS/oodikone/releases',
    {}
  )

  if (data) {
    const releasesFromAPI: Release[] = data.map(release => ({
      description: release.body,
      time: release.published_at,
      title: release.name,
      version: release.tag_name,
    }))

    changelog.data = releasesFromAPI
    res.status(200).json(releasesFromAPI)
  }

  res.status(500).send()
})

export default router
