import { RTKApi } from '@/apiConnection'

const customPopulationSearchApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCustomPopulationSearches: builder.query({
      query: () => '/custom-population-search',
      providesTags: [{ type: 'CustomPopulationSearches', id: 'LIST' }],
    }),
    createCustomPopulationSearch: builder.mutation({
      query: ({ name, students }) => ({
        url: '/custom-population-search',
        method: 'POST',
        body: {
          name,
          students,
        },
      }),
      invalidatesTags: [{ type: 'CustomPopulationSearches', id: 'LIST' }],
    }),
    updateCustomPopulationSearch: builder.mutation({
      query: ({ id, students }) => ({
        url: `/custom-population-search/${id}`,
        method: 'PUT',
        body: {
          students,
        },
      }),
      invalidatesTags: [{ type: 'CustomPopulationSearches', id: 'LIST' }],
    }),
    deleteCustomPopulationSearch: builder.mutation({
      query: ({ id }) => ({
        url: `/custom-population-search/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'CustomPopulationSearches', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetCustomPopulationSearchesQuery,
  useCreateCustomPopulationSearchMutation,
  useUpdateCustomPopulationSearchMutation,
  useDeleteCustomPopulationSearchMutation,
} = customPopulationSearchApi
