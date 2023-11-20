import { RTKApi } from 'apiConnection'
import { useHistory } from 'react-router-dom'
import { showAsUserKey } from 'common'
import { isDev } from 'conf'

const authorizationApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    login: builder.query({
      query: () => '/login',
    }),
    logout: builder.mutation({
      queryFn: (_, { getState }) => {
        const loginQuerySelector = RTKApi.endpoints.login.select()
        const { data, error } = loginQuerySelector(getState())
        const logoutUrl = data?.logoutUrl ?? error?.data?.logoutUrl
        if (logoutUrl) {
          window.location.href = logoutUrl
        }
        return {
          error: {
            data: {
              message: 'Logout url was not available, not able to logout correctly!',
            },
          },
        }
      },
    }),
  }),
  overrideExisting: false,
})

const { useLoginQuery } = authorizationApi

export const useGetAuthorizedUserQuery = () => {
  const { data, isLoading, isFetching, error, ...rest } = useLoginQuery()
  if (isLoading || isFetching || error) return { data, isLoading, isFetching, error, ...rest }

  const { user } = data

  return {
    ...user,
    isLoading,
    error,
    ...rest,
  }
}

export const useShowAsUser = () => {
  const history = useHistory()

  const showAsUser = (username, reload = true) => {
    if (username) {
      window.localStorage.setItem(showAsUserKey, username)
    } else {
      window.localStorage.removeItem(showAsUserKey)
    }

    if (reload) {
      history.push('/')
      window.location.reload()
    }
  }

  return showAsUser
}

const { useLogoutMutation: internalMutation } = authorizationApi

const devLogout = () => window.location.reload()

export const useLogoutMutation = () => {
  const [productionLogout, ...rest] = internalMutation()
  const showAsUser = useShowAsUser()

  const handleLogout = () => {
    showAsUser(null, false)
    const logout = isDev ? devLogout : productionLogout
    logout()
  }
  return [handleLogout, ...rest]
}
