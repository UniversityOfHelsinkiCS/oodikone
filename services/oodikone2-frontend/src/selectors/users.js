import { createSelector } from 'reselect'

const getUsers = users => (!users.pending && !users.error ? users.data : [])

export const sortUsers = users =>
  users.sort((a, b) => a.full_name.localeCompare(b.full_name))

export const makeSortUsers = () => createSelector(
  getUsers,
  sortUsers
)
