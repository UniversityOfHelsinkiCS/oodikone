/**
 * Global definitions for query params.
 */
import qs from 'query-string'

/**
 * All query params from given `location`.
 * @param {object} location React-Router's `location` object.
 */
export const queryParamsFromUrl = location => qs.parse(location.search)

/**
 * Get `months` parameter from query.
 * @param {object} location React-Router's `location` object.
 */
export const getMonths = location => queryParamsFromUrl(location).months
