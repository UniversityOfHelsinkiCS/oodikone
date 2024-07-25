import * as Sentry from '@sentry/node'
import axios from 'axios'

import { importerToken, jamiUrl, serviceProvider } from '../config'
import { IamAccess } from '../types'
import logger from './logger'

const jamiClient = axios.create({
  baseURL: jamiUrl,
  params: {
    token: importerToken,
  },
})

type UserIamAccess = {
  iamAccess?: IamAccess
  specialGroup?: Record<string, boolean>
}

export const getUserIamAccess = async (
  sisPersonId: string,
  iamGroups: string[],
  attempt: number = 1
): Promise<UserIamAccess> => {
  if (iamGroups.length === 0) {
    return {}
  }
  try {
    const { data: iamAccess } = await jamiClient.post('/', {
      userId: sisPersonId,
      iamGroups,
      getSisuAccess: true,
    })
    const { specialGroup } = iamAccess as { specialGroup: Record<string, boolean> }
    delete iamAccess.specialGroup
    return { iamAccess, specialGroup }
  } catch (error) {
    if (attempt > 3) {
      logger.error('[Jami] error: ', error)
      Sentry.captureException(error)
      return {}
    }
    return getUserIamAccess(sisPersonId, iamGroups, attempt + 1)
  }
}

export const getUserIams = async (userId: string) => {
  try {
    const { data } = await jamiClient.get(`/${userId}`)
    return data.iamGroups as string[]
  } catch (error: any) {
    if (error.response.status !== 404) {
      logger.error('[Jami] error: ', error)
      Sentry.captureException(error)
    }
    return []
  }
}

type Access = {
  id: string
  iamGroups: string[]
  access: IamAccess
  specialGroup: Record<string, boolean>
}

export const getAllUserAccess = async (userIds: string[]) => {
  const { data } = await jamiClient.post('access-and-special-groups', { userIds })
  return data as Access[]
}

const testJami = async () => {
  try {
    await jamiClient.get('/ping', { timeout: 4000 })
    logger.info('JAMI connected')
  } catch (error) {
    logger.error(error)
    logger.warn('JAMI not responding :(')
    logger.info('Are you sure you are using the latest JAMI image?')
  }
}

if (serviceProvider === 'Toska') {
  testJami()
}
