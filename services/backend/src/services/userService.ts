import { isEqual, keyBy, omit, uniq } from 'lodash'
import { LRUCache } from 'lru-cache'

import { User } from '@oodikone/shared/models/user'
import { DetailedProgrammeRights, Role } from '@oodikone/shared/types'
import { serviceProvider } from '../config'
import { roles } from '../config/roles'
import { sequelizeUser } from '../database/connection'
import { UserModel } from '../models/user'
import { ExpandedUser, FormattedUser, IamAccess } from '../types'

import { createLocaleComparator, getFullStudyProgrammeRights, hasFullAccessToStudentData } from '../util'
import * as jami from '../util/jami'
import mami from '../util/mami'
import { sendNotificationAboutNewUser } from './mailService'
import { getSisuAuthData, personSearchQuery, getGraphqlData } from './oriProvider'
import { getStudentnumbersByElementdetails } from './students'
import { checkStudyGuidanceGroupsAccess, getAllStudentsUserHasInGroups } from './studyGuidanceGroups'

const userAccessUtils = serviceProvider === 'toska' ? jami : mami
const { getAllUserAccess, getUserIams, getUserIamAccess } = userAccessUtils

const courseStatisticsGroup = 'grp-oodikone-basic-users'
const facultyStatisticsGroup = 'grp-oodikone-users'

// Max 25 users can be stored in the cache, and the data is valid for 1 hour
const userDataCache = new LRUCache({ max: 25, ttl: 1000 * 60 * 60 })

export const deleteOutdatedUsers = async () => {
  return sequelizeUser.query("DELETE FROM users WHERE last_login < CURRENT_DATE - INTERVAL '18 months'")
}

const isRole = (role: string) => {
  return (roles as readonly string[]).includes(role)
}

export const modifyAccess = async (username: string, rolesOfUser: Record<Role, boolean>) => {
  const user = await UserModel.findOne({ where: { username } })
  if (!user) {
    throw new Error(`User ${username} not found`)
  }
  const newRoles = Object.keys(rolesOfUser).filter(role => isRole(role) && rolesOfUser[role]) as Role[]
  user.roles = newRoles
  await user.save()
  userDataCache.delete(username)
}

export const modifyElementDetails = async (id: string, codes: string[], enable: boolean) => {
  const user = await UserModel.findOne({ where: { id } })
  if (!user) {
    throw new Error(`User with id ${id} not found`)
  }
  if (enable === true) {
    user.programmeRights = uniq([...user.programmeRights, ...codes])
  } else {
    user.programmeRights = user.programmeRights.filter(code => !codes.includes(code))
  }
  await user.save()
  userDataCache.delete(user.username)
}

export const updateUser = async (username: string, fields: Partial<User>) => {
  const user = await UserModel.findOne({ where: { username } })
  if (!user) {
    throw new Error(`User ${username} not found`)
  }
  await user.update(fields)
  userDataCache.delete(username)
}

const getIamBasedRights = (iamAccess: IamAccess): DetailedProgrammeRights[] => {
  if (!iamAccess) {
    return []
  }

  return Object.entries(iamAccess).map(([code, rights]) => ({
    code,
    limited: !rights.admin,
    isIamBased: true,
  }))
}

const getUserProgrammesRights = (userProgrammes: string[]): DetailedProgrammeRights[] => {
  return userProgrammes.map(code => ({
    code,
    limited: false,
    isIamBased: false,
  }))
}

const getStudyProgrammeRights = (
  iamAccess: IamAccess,
  specialGroup: Record<string, boolean>,
  userProgrammes: string[]
): DetailedProgrammeRights[] => {
  const hasFullSisuAccess = specialGroup?.fullSisuAccess

  const iamBasedRights = hasFullSisuAccess ? [] : getIamBasedRights(iamAccess)
  const userProgrammesRights = getUserProgrammesRights(userProgrammes)

  const studyProgrammeRights = [...iamBasedRights, ...userProgrammesRights]
  return studyProgrammeRights
}

const formatUser = async (user: ExpandedUser, getStudentAccess = true) => {
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(user.detailedProgrammeRights)
  const shouldFetchStudentAccess = getStudentAccess && !hasFullAccessToStudentData(user.roles)

  let studentsUserCanAccess: string[] = []
  if (shouldFetchStudentAccess) {
    const promises = [
      getStudentnumbersByElementdetails(fullStudyProgrammeRights),
      getAllStudentsUserHasInGroups(user.sisuPersonId),
    ]

    const studentLists = await Promise.all(promises)
    const flatStudentNumbers = studentLists.flat()

    studentsUserCanAccess = uniq(flatStudentNumbers)
  }

  const formattedUser: FormattedUser = {
    id: user.id,
    userId: user.username,
    username: user.username,
    name: user.fullName,
    language: user.language,
    sisPersonId: user.sisuPersonId,
    email: user.email,
    roles: user.roles,
    studentsUserCanAccess,
    isAdmin: user.roles.includes('admin'),
    programmeRights: user.detailedProgrammeRights,
    iamGroups: user.iamGroups || [],
    mockedBy: user.mockedBy,
    lastLogin: user.lastLogin,
  }

  return formattedUser
}

const formatUserForFrontend = async (user: ExpandedUser) => {
  const formattedUser = await formatUser(user, false)
  return omit(formattedUser, ['studentsUserCanAccess', 'isAdmin', 'mockedBy', 'userId'])
}

const updateAccessGroups = async (
  username: string,
  iamGroups: string[],
  specialGroup: Record<string, boolean>,
  sisId: string
) => {
  const { jory, superAdmin, openUni, fullSisuAccess } = specialGroup
  const userFromDb = await UserModel.findOne({ where: { username } })
  if (!userFromDb) {
    throw new Error(`User ${username} not found`)
  }
  const currentAccessGroups = userFromDb?.roles ?? []

  const newAccessGroups = [
    ...(currentAccessGroups.includes('studyGuidanceGroups') || (await checkStudyGuidanceGroupsAccess(sisId))
      ? ['studyGuidanceGroups']
      : []),
    ...(iamGroups.includes(courseStatisticsGroup) ? ['courseStatistics'] : []),
    ...(jory || iamGroups.includes(facultyStatisticsGroup) ? ['facultyStatistics'] : []),
    ...(currentAccessGroups.includes('teachers') ? ['teachers'] : []),
    ...(superAdmin || currentAccessGroups.includes('admin') ? ['admin'] : []),
    ...(openUni ? ['openUniSearch'] : []),
    ...(fullSisuAccess ? ['fullSisuAccess'] : []),
  ] as Role[]

  if (!isEqual(newAccessGroups.sort(), currentAccessGroups.sort())) {
    userFromDb.roles = newAccessGroups
    await userFromDb.save()
  }
}

export const findAll = async () => {
  const users = (await UserModel.findAll()).map(user => user.toJSON())
  const userAccess = await getAllUserAccess(users.map(user => user.sisuPersonId))
  const userAccessMap = keyBy(userAccess, 'id')

  const formattedUsers = await Promise.all(
    users.map(async user => {
      const { iamGroups, specialGroup, access } = userAccessMap[user.sisuPersonId] || {}
      const detailedProgrammeRights = getStudyProgrammeRights(access, specialGroup, user.programmeRights)
      const formattedUser = await formatUserForFrontend({ ...user, detailedProgrammeRights, iamGroups })
      return formattedUser
    })
  )
  return formattedUsers.sort(createLocaleComparator('name'))
}

export const findOne = async (id: string) => {
  const user = (await UserModel.findOne({ where: { id } }))?.toJSON()
  if (!user) {
    throw new Error(`User with id ${id} not found`)
  }
  const iamGroups = await getUserIams(user.sisuPersonId)
  const { iamAccess, specialGroup } = await getUserIamAccess(user.sisuPersonId, iamGroups)
  const detailedProgrammeRights = getStudyProgrammeRights(iamAccess, specialGroup, user.programmeRights)
  const formattedUser = await formatUserForFrontend({ ...user, detailedProgrammeRights, iamGroups })
  return formattedUser
}

export const findByUsername = async (username: string) => {
  return (await UserModel.findOne({ where: { username } }))?.toJSON()
}

export const getOrganizationAccess = async (sisPersonId: string, iamGroups: string[]) => {
  if (!iamGroups.length) {
    return {}
  }
  const { iamAccess, specialGroup } = await getUserIamAccess(sisPersonId, iamGroups)
  return { iamAccess, specialGroup }
}

export const getMockedUser = async ({ userToMock, mockedBy }: { userToMock: string; mockedBy: string }) => {
  // Using different keys for users being mocked to prevent users from seeing themselves as mocked. Also, if the user
  // is already logged in, we don't want the regular data from the cache because that doesn't have the mockedBy field
  const cacheKey = `mocking-as-${userToMock}`
  if (userDataCache.has(cacheKey)) {
    const cachedUser = userDataCache.get(cacheKey) as FormattedUser
    if (cachedUser.mockedBy !== mockedBy) {
      cachedUser.mockedBy = mockedBy
      userDataCache.set(cacheKey, cachedUser)
    }
    return cachedUser
  }

  const userFromDb = (await UserModel.findOne({ where: { username: userToMock } }))?.toJSON()
  if (!userFromDb) {
    return null
  }
  const iamGroups = await getUserIams(userFromDb.sisuPersonId)
  const { iamAccess, specialGroup } = await getOrganizationAccess(userFromDb.sisuPersonId, iamGroups)
  const detailedProgrammeRights = getStudyProgrammeRights(iamAccess, specialGroup, userFromDb.programmeRights)
  const mockedUser = await formatUser({ ...userFromDb, iamGroups, detailedProgrammeRights, mockedBy })
  userDataCache.set(cacheKey, mockedUser)
  return mockedUser
}

export const getMockedUserFd = async ({ userToMock, mockedBy }: { userToMock: string; mockedBy: string }) => {
  const mockedByFromDb = (await UserModel.findOne({ where: { username: mockedBy } }))?.toJSON()
  if (!mockedByFromDb) {
    return null
  }
  return await getMockedUser({ userToMock, mockedBy })
}

export const getUserToska = async ({
  username,
  name,
  email,
  iamGroups,
  specialGroup,
  sisId,
  iamAccess,
}: {
  username: string
  name: string
  email: string
  iamGroups: string[]
  specialGroup: Record<string, boolean>
  sisId: string
  iamAccess: IamAccess
}) => {
  if (userDataCache.has(username)) {
    return userDataCache.get(username) as FormattedUser
  }

  const isNewUser = !(await UserModel.findOne({ where: { username } }))
  await UserModel.upsert({ fullName: name, username, email, sisuPersonId: sisId, lastLogin: new Date() })
  await updateAccessGroups(username, iamGroups, specialGroup, sisId)
  const userFromDb = (await UserModel.findOne({ where: { username } }))!.toJSON()

  const detailedProgrammeRights = getStudyProgrammeRights(iamAccess, specialGroup, userFromDb.programmeRights)
  const user = await formatUser({ ...userFromDb, iamGroups, detailedProgrammeRights })
  if (isNewUser) {
    await sendNotificationAboutNewUser({ userId: username, userFullName: name })
  }
  userDataCache.set(username, user)
  return user
}

export const getUserFd = async ({ username }: { username: string }) => {
  if (userDataCache.has(username)) {
    return userDataCache.get(username) as FormattedUser
  }

  const userFromDbOrm = await UserModel.findOne({ where: { username } })
  if (!userFromDbOrm) {
    return null
  }

  userFromDbOrm.lastLogin = new Date()
  await userFromDbOrm.save()

  const userFromDb = userFromDbOrm.toJSON()

  const detailedProgrammeRights = getStudyProgrammeRights({}, {}, userFromDb.programmeRights)
  const user = await formatUser({ ...userFromDb, iamGroups: [], detailedProgrammeRights })

  userDataCache.set(username, user)
  return user
}

export const addNewUser = async user => {
  const name = user.first_name.concat(' ', user.last_name)
  try {
    await UserModel.upsert({
      fullName: name,
      username: user.eppn,
      email: user.email_address,
      sisuPersonId: user.id,
      roles: [],
      lastLogin: new Date(),
    })
    return true
  } catch (error) {
    throw new Error('Could not add or update user.')
  }
}

export const getUserFromSisuByEppn = async (requesterEppn: string, newUserEppn: string) => {
  const { accessToken: requesterAccessToken } = await getSisuAuthData(requesterEppn)
  const { tokenData: newUserTokenData } = await getSisuAuthData(newUserEppn)
  const personData = await getGraphqlData(requesterAccessToken, {
    query: personSearchQuery,
    variables: { subjectUserId: newUserTokenData.personid },
  })
  return personData
}

export const deleteUserById = async userId => {
  await UserModel.destroy({
    where: {
      id: userId,
    },
  })
}
