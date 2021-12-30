import { RTKApi } from 'apiConnection'

const authorizationApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    login: builder.query({
      query: () => '/login',
    }),
    logout: builder.mutation({
      queryFn: (_, { getState }) => {
        const loginQuerySelector = RTKApi.endpoints.login.select()
        const { data, error } = loginQuerySelector(getState())
        const logoutUrl = data.logoutUrl ?? error.logoutUrl
        if (logoutUrl) {
          window.location.href = logoutUrl
        }
        return {
          error: {
            status: 500,
            statusText: 'Internal Server Error',
            data: 'Logout url was not available, not able to logout correctly!',
          },
        }
      },
    }),
  }),
  overrideExisting: false,
})

const { useLoginQuery } = authorizationApi

export const useGetAuthorizedUserQuery = () => {
  const { data, isLoading, error, ...rest } = useLoginQuery()

  if (isLoading || error) return { data, isLoading, error, ...rest }

  const { token } = data
  const userRoles = token?.roles?.map(r => r.group_code) ?? []

  return {
    ...token,
    userRoles,
    isAdmin: userRoles.includes('admin'),
    isLoading,
    ...rest,
  }
}

export const { useLogoutMutation } = authorizationApi
