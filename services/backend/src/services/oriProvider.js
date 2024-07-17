const axios = require('axios')

const { sisUrl, sisGrapqlAppAccount, sisGrapqlAppKey } = require('../config')
const { ApplicationError } = require('../util/customErrors')

const getSisuAccessToken = async eppn => {
  const oriAppAuthPath = `${sisUrl}/ori/application-auth`
  let sisuResponse
  try {
    sisuResponse = await axios.post(
      oriAppAuthPath,
      {
        username: sisGrapqlAppAccount,
        key: sisGrapqlAppKey,
        executingEppn: eppn,
      },
      { 'content-type': 'application/json' }
    )
  } catch (error) {
    throw new ApplicationError(
      'Could not find the user in Sisu, either with the eppn of the user or the new person.',
      404
    )
  }
  return sisuResponse.data.authToken
}

const decodeJwtTokenPayloadToObject = token => {
  const payload = token.split('.')[1]
  const paddedPayload = `${payload}==`
  const bufferObj = Buffer.from(paddedPayload, 'base64')
  return JSON.parse(bufferObj.toString('utf-8'))
}

const getSisuAuthData = async eppn => {
  const accessToken = await getSisuAccessToken(eppn)
  const tokenData = decodeJwtTokenPayloadToObject(accessToken)
  return { accessToken, tokenData }
}

const personSearchQuery = `query privatePerson($subjectUserId: ID!) {
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

const getGraphqlData = async (accessToken, queryObject) => {
  const graphQlUrl = `${sisUrl}/api`
  const authHeader = `Application ${accessToken}`
  const config = {
    url: graphQlUrl,
    method: 'post',
    headers: {
      Authorization: authHeader,
      'Accept-Charset': 'UTF-8',
      'Content-Type': 'application/json',
    },
    data: queryObject,
  }
  let graphQlResponse
  try {
    graphQlResponse = await axios(config)
  } catch (error) {
    throw new ApplicationError('Graphql request failed for unclear reasons.', 500)
  }
  return graphQlResponse.data.data.private_person
}

module.exports = {
  getSisuAccessToken,
  decodeJwtTokenPayloadToObject,
  getSisuAuthData,
  personSearchQuery,
  getGraphqlData,
}
