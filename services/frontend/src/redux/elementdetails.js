import { RTKApi } from 'apiConnection'
import { getTextIn } from 'common'
import { callController } from '../apiConnection'

// original elementdetail stuff
export const getElementDetails = () => {
  const route = '/elementdetails/all'
  const prefix = 'GET_ELEMENTDETAILS_'
  return callController(route, prefix)
}

const reducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'GET_ELEMENTDETAILS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false,
      }
    case 'GET_ELEMENTDETAILS_FAILURE':
      return {
        pending: false,
        error: true,
        data: [],
      }
    case 'GET_ELEMENTDETAILS_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response,
      }
    default:
      return state
  }
}

// RTK query based stuff

const elementDetailsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getAllElementDetails: builder.query({
      query: () => '/elementdetails/all',
      providesTags: result => [
        // eslint-disable-next-line no-unsafe-optional-chaining
        ...result?.map(({ id }) => ({ type: 'StudyGuidanceGroups', id })),
        { type: 'StudyGuidanceGroups', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
})

export const { useGetAllElementDetailsQuery } = elementDetailsApi

// Returns only newest studyprogrammes and formats them to be used in semantic ui dropdowns
export const useFilteredAndFormattedElementDetails = language => {
  const { data, isLoading } = useGetAllElementDetailsQuery()
  const filteredAndFormatted = isLoading
    ? []
    : data
        .filter(elem => elem.code.startsWith('KH') || elem.code.startsWith('MH'))
        .map(elem => ({
          key: elem.code,
          value: elem.code,
          description: elem.code,
          text: getTextIn(elem.name, language),
        }))

  return filteredAndFormatted
}

export default reducer
