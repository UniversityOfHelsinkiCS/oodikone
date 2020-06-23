/**
 * Global definitions for Population Statistics HTTP GET query.
 */
import qs from 'qs'

const parseParams = location => qs.parse(location.search, { ignoreQueryPrefix: true })

/**
 * Get `months` parameter from query.
 * @param {object} location React-Router's `location` object.
 */
/* eslint-disable-next-line import/prefer-default-export */
export const getMonths = location => parseParams(location).months
