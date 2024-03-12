import { RTKApi } from '@/apiConnection'
import { getUnifiedProgrammeName } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'

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
export const useFilteredAndFormattedElementDetails = () => {
  const { data, isLoading } = useGetAllElementDetailsQuery()
  const { language, getTextIn } = useLanguage()
  const filteredAndFormatted = isLoading
    ? []
    : data
        .filter(elem => elem.code.startsWith('KH') || elem.code.startsWith('MH'))
        .map(elem => ({
          key: elem.code,
          value: elem.code,
          description: elem.code,
          text: getTextIn(elem.name),
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
              getTextIn(dataForCombined.KH90_001),
              getTextIn(dataForCombined.MH90_001),
              language
            ),
          },
        ]

  return [...filteredAndFormatted, ...combinedOptions]
}
