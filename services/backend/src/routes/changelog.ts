import axios from 'axios'
import { Response, Router } from 'express'

import { isDev } from '../config'

const router = Router()

type ChangeLogData = {
  description: string
  time: Date
  title: string
}

const changelog: { data?: ChangeLogData[] } = {}

router.get('/', async (_req, res: Response) => {
  if (changelog.data) {
    return res.status(200).send(changelog.data)
  }
  if (isDev) {
    const fakeChangeLogData: ChangeLogData[] = [
      {
        description: "### Fake release\nLet's not spam the GitHub API in development!",
        title: 'Fake title for fake release',
        time: new Date(),
      },
    ]
    return res.status(200).json(fakeChangeLogData)
  }
  const response = await axios.get('https://api.github.com/repos/UniversityOfHelsinkiCS/oodikone/releases')
  const newChangelogData = response.data.map((release: Record<string, any>) => ({
    description: release.body,
    time: release.created_at,
    title: release.name,
  }))
  changelog.data = newChangelogData
  res.status(200).send(newChangelogData)
})

export default router
