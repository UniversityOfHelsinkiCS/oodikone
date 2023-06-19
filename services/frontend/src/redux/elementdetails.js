import { RTKApi } from 'apiConnection'
import { getTextIn, getUnifiedProgrammeName } from 'common'
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
  // create options for combined programmes
  const combinedProgrammeCodes = ['KH90_001', 'MH90_001']
  const dataForCombined = isLoading
    ? {}
    : data
        .filter(elem => combinedProgrammeCodes.includes(elem.code))
        .reduce((acc, elem) => ({ ...acc, [elem.code]: elem.name }), {})

  const combinedOptions =
    isLoading && !dataForCombined
      ? []
      : [
          {
            key: 'KH90_001+MH90_001',
            value: 'KH90_001+MH90_001',
            description: 'KH90_001+MH90_001',
            text: getUnifiedProgrammeName(
              getTextIn(dataForCombined.KH90_001, language),
              getTextIn(dataForCombined.MH90_001, language),
              language
            ),
          },
        ]

  return [...filteredAndFormatted, ...combinedOptions]
}

export default reducer
