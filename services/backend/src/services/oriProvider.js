import { Fetchios } from '@oodikone/shared/util/fetchios'

const { sisUrl, sisGrapqlAppAccount, sisGrapqlAppKey } = require('../config')
const { ApplicationError } = require('../util/customErrors')

export const getSisuAccessToken = async eppn => {
  const oriAppAuthPath = `${sisUrl}/ori/application-auth`
  try {
    const sisuResponse = await Fetchios.post(
      oriAppAuthPath,
      {
        username: sisGrapqlAppAccount,
        key: sisGrapqlAppKey,
        executingEppn: eppn,
      },
      { 'content-type': 'application/json' }
    )

    return sisuResponse.data.authToken
  } catch (error) {
    throw new ApplicationError(
      'Could not find the user in Sisu, either with the eppn of the user or the new person.',
      404
    )
  }
}

export const decodeJwtTokenPayloadToObject = token => {
  const payload = token.split('.')[1]
  const paddedPayload = `${payload}==`
  const bufferObj = Buffer.from(paddedPayload, 'base64')
  return JSON.parse(bufferObj.toString('utf-8'))
}

export const getSisuAuthData = async eppn => {
  const accessToken = await getSisuAccessToken(eppn)
  const tokenData = decodeJwtTokenPayloadToObject(accessToken)
  return { accessToken, tokenData }
}

export const personSearchQuery = `query privatePerson($subjectUserId: ID!) {
      private_person(id: $subjectUserId) {
          id
          first_name:firstNames
          last_name:lastName
          call_name:callName
          eppn:eduPersonPrincipalName
          email_address:primaryEmail
          student_number:studentNumber
          phone_number:phoneNumber
          document_state:documentState
      }
  }`

export const getGraphqlData = async (accessToken, queryObject) => {
  try {
    const graphQlResponse = await Fetchios.post(`${sisUrl}/api`, queryObject, {
      headers: {
        Authorization: `Application ${accessToken}`,
        'Accept-Charset': 'UTF-8',
        'Content-Type': 'application/json',
      },
    })
    return graphQlResponse.data.data.private_person
  } catch (error) {
    throw new ApplicationError('Graphql request failed for unclear reasons.', 500)
  }
}
