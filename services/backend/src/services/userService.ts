import { isEqual, keyBy, omit, uniq } from 'lodash'
import { LRUCache } from 'lru-cache'

import { serviceProvider } from '../config'
import { roles } from '../config/roles'
import { sequelizeUser } from '../database/connection'
import { User } from '../models/user'
import { Role } from '../types'
import { createLocaleComparator, getFullStudyProgrammeRights, hasFullAccessToStudentData } from '../util'
import jami from '../util/jami'
import mami from '../util/mami'
import { sendNotificationAboutNewUser } from './mailservice'
import { getSisuAuthData, personSearchQuery, getGraphqlData } from './oriProvider'
import { getStudentnumbersByElementdetails } from './students'
import { checkStudyGuidanceGroupsAccess, getAllStudentsUserHasInGroups } from './studyGuidanceGroups'

const userAccessUtils = serviceProvider === 'Toska' ? jami : mami
const { getAllUserAccess, getUserIams, getUserIamAccess } = userAccessUtils

const courseStatisticsGroup = 'grp-oodikone-basic-users'
const facultyStatisticsGroup = 'grp-oodikone-users'

// Max 25 users can be stored in the cache, and the data is valid for 1 hour
const userDataCache = new LRUCache({ max: 25, ttl: 1000 * 60 * 60 })

const findUser = async where => User.findOne({ where })

export const deleteOutdatedUsers = async () => {
  return sequelizeUser.query("DELETE FROM users WHERE last_login < CURRENT_DATE - INTERVAL '18 months'")
}

const isRole = (role: string): role is Role => {
  return (roles as readonly string[]).includes(role)
}

export const modifyAccess = async (username: string, rolesOfUser: Record<string, boolean>) => {
  const user = await findUser({ username })
  const newRoles = Object.keys(rolesOfUser).filter(role => isRole(role) && rolesOfUser[role]) as Role[]
  user.roles = newRoles
  await user.save()
  userDataCache.delete(username)
}

export const modifyElementDetails = async (id: bigint, codes: string[], enable: boolean) => {
  const user = await findUser({ id })
  if (enable === true) {
    user.programmeRights = uniq([...user.programmeRights, ...codes])
  } else {
    user.programmeRights = user.programmeRights.filter(code => !codes.includes(code))
  }
  await user.save()
  userDataCache.delete(user.username)
}

export const updateUser = async (username: string, fields: Array<Record<string, any>>) => {
  const user = await findUser({ username })
  if (!user) {
    throw new Error(`User ${username} not found`)
  }
  await user.update(fields)
  userDataCache.delete(username)
}

type IamAccess = Record<string, Record<'read' | 'write' | 'admin', boolean>>

type DetailedProgrammeRights = {
  code: string
  limited: boolean
  isIamBased: boolean
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

type ExpandedUser = User & {
  iamGroups: string[]
  mockedBy?: string
  detailedProgrammeRights: DetailedProgrammeRights[]
}

const formatUser = async (user: ExpandedUser, getStudentAccess: boolean = true) => {
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(user.programmeRights)
  const shouldFetchStudentAccess = getStudentAccess && !hasFullAccessToStudentData(user.roles)

  let studentsUserCanAccess = []
  if (shouldFetchStudentAccess) {
    const promises = [
      getStudentnumbersByElementdetails(fullStudyProgrammeRights),
      getAllStudentsUserHasInGroups(user.sisuPersonId),
    ]

    const studentLists = await Promise.all(promises)
    const flatStudentNumbers = studentLists.flat()

    studentsUserCanAccess = uniq(flatStudentNumbers)
  }

  const formattedUser = {
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
  const { jory, hyOne, superAdmin, openUni, katselmusViewer, fullSisuAccess } = specialGroup
  const userFromDb = await findUser({ username })
  const currentAccessGroups = userFromDb.roles

  const newAccessGroups = [
    ...(currentAccessGroups.includes('studyGuidanceGroups') || (await checkStudyGuidanceGroupsAccess(sisId))
      ? ['studyGuidanceGroups']
      : []),
    ...(iamGroups.includes(courseStatisticsGroup) ? ['courseStatistics'] : []),
    ...(jory || iamGroups.includes(facultyStatisticsGroup) ? ['facultyStatistics'] : []),
    ...(hyOne || currentAccessGroups.includes('teachers') ? ['teachers'] : []),
    ...(superAdmin || currentAccessGroups.includes('admin') ? ['admin'] : []),
    ...(openUni ? ['openUniSearch'] : []),
    ...(katselmusViewer ? ['katselmusViewer'] : []),
    ...(fullSisuAccess ? ['fullSisuAccess'] : []),
  ] as Role[]

  if (!isEqual(newAccessGroups.sort(), currentAccessGroups.sort())) {
    userFromDb.roles = newAccessGroups
    await userFromDb.save()
  }
}

export const findAll = async () => {
  const users = (await User.findAll()).map(user => user.toJSON())
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

export const findOne = async (id: bigint) => {
  const user = (await findUser({ id })).toJSON()
  if (!user) {
    throw new Error(`User with id ${id} not found`)
  }
  const iamGroups = await getUserIams(user.sisuPersonId)
  const { iamAccess, specialGroup } = await getUserIamAccess(user.sisuPersonId, iamGroups)
  const programmeRights = getStudyProgrammeRights(iamAccess, specialGroup, user.programmeRights)
  const formattedUser = await formatUserForFrontend({ ...user, programmeRights, iamGroups })
  return formattedUser
}

export const getOrganizationAccess = async (sisPersonId: string, iamGroups: string[]) => {
  if (!iamGroups.length) {
    return {}
  }
  const { iamAccess, specialGroup } = await getUserIamAccess(sisPersonId, iamGroups)
  return { access: iamAccess || {}, specialGroup }
}

const basicGetMockedUser = async ({ userToMock, mockedBy }: { userToMock: string; mockedBy: string }) => {
  // Using different keys for users being mocked to prevent users from seeing themselves as mocked. Also, if the user
  // is already logged in, we don't want the regular data from the cache because that doesn't have the mockedBy field
  const cacheKey = `mocking-as-${userToMock}`
  if (userDataCache.has(cacheKey)) {
    const cachedUser = userDataCache.get(cacheKey) as User & { mockedBy: string }
    if (cachedUser.mockedBy !== mockedBy) {
      cachedUser.mockedBy = mockedBy
      userDataCache.set(cacheKey, cachedUser)
    }
    return cachedUser
  }

  const userFromDb = (await findUser({ username: userToMock })).toJSON()
  const iamGroups = await getUserIams(userFromDb.sisuPersonId)
  const { access, specialGroup } = await getOrganizationAccess(userFromDb.sisuPersonId, iamGroups)
  const detailedProgrammeRights = getStudyProgrammeRights(access, specialGroup, userFromDb.programmeRights)
  const mockedUser = await formatUser({ ...userFromDb, iamGroups, detailedProgrammeRights, mockedBy })
  userDataCache.set(cacheKey, mockedUser)
  return mockedUser
}

const fdGetMockedUser = async ({ userToMock, mockedBy }: { userToMock: string; mockedBy: string }) => {
  const mockedByFromDb = (await findUser({ username: mockedBy })).toJSON()
  if (!mockedByFromDb) {
    return null
  }
  return await basicGetMockedUser({ userToMock, mockedBy })
}

const toskaGetUser = async ({
  username,
  name,
  email,
  iamGroups,
  specialGroup,
  sisId,
  access,
}: {
  username: string
  name: string
  email: string
  iamGroups: string[]
  specialGroup: Record<string, boolean>
  sisId: string
  access: IamAccess
}) => {
  if (userDataCache.has(username)) {
    return userDataCache.get(username)
  }

  const isNewUser = !(await User.findOne({ where: { username } }))
  await User.upsert({ fullName: name, username, email, sisuPersonId: sisId, lastLogin: new Date() })
  await updateAccessGroups(username, iamGroups, specialGroup, sisId)
  const userFromDb = (await findUser({ username })).toJSON()

  const detailedProgrammeRights = getStudyProgrammeRights(access, specialGroup, userFromDb.programmeRights)
  const user = await formatUser({ ...userFromDb, iamGroups, detailedProgrammeRights })
  if (isNewUser) {
    await sendNotificationAboutNewUser({ userId: username, userFullName: name })
  }
  userDataCache.set(username, user)
  return user
}

const fdGetUser = async ({ username }: { username: string }) => {
  if (userDataCache.has(username)) {
    return userDataCache.get(username)
  }

  const userFromDbOrm = await findUser({ username })
  if (!userFromDbOrm) {
    return
  }

  userFromDbOrm.lastLogin = new Date()
  userFromDbOrm.save()

  const userFromDb = userFromDbOrm.toJSON()

  const programmeRights = getStudyProgrammeRights({}, {}, userFromDb.programmeRights)
  const user = await formatUser({ ...userFromDb, iamGroups: [], programmeRights })

  userDataCache.set(username, user)
  return user
}

export const addNewUser = async user => {
  const name = user.first_name.concat(' ', user.last_name)
  await User.upsert({
    fullName: name,
    username: user.eppn,
    email: user.email_address,
    sisuPersonId: user.id,
    roles: [],
  })
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

export const getUser = serviceProvider === 'Toska' ? toskaGetUser : fdGetUser
export const getMockedUser = serviceProvider === 'Toska' ? basicGetMockedUser : fdGetMockedUser
