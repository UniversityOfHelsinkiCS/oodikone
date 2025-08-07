import AddIcon from '@mui/icons-material/Add'
import SendIcon from '@mui/icons-material/Send'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useEffect, useState } from 'react'
import { Loading } from '@/components/material/Loading'
import { Section } from '@/components/material/Section'
import { useLazyGetUserFromSisuByEppnQuery, useAddUserMutation } from '@/redux/users'

export const NewUserSection = ({ onAddUser }) => {
  const [eppn, setEppn] = useState('')
  const [user, setUser] = useState<any>()
  const [showAdded, setShowAdded] = useState(false)
  const [showAddError, setShowAddError] = useState(false)

  const [
    getUserFromSisuByEppnQuery,
    { data: userFromApi, isLoading: isLoadingGetUser, isError: isErrorGetUser, isFetching },
  ] = useLazyGetUserFromSisuByEppnQuery()
  const [
    addUserMutation,
    { data: addedUser, isLoading: isLoadingAddUser, isError: isErrorAddUser, error: addUserError },
  ] = useAddUserMutation()

  useEffect(() => {
    if (!isLoadingGetUser && !isErrorAddUser && !isFetching) {
      setUser(userFromApi)
    }
  }, [userFromApi, isLoadingGetUser, isErrorGetUser, isFetching, isErrorAddUser])

  useEffect(() => {
    if (!isLoadingAddUser && !isErrorAddUser && addedUser) {
      setUser('')
      setEppn('')
      onAddUser()
      setShowAdded(true)
      setTimeout(() => setShowAdded(false), 2000)
    }
    if (isErrorAddUser) {
      if ('status' in addUserError && addUserError.status === 400) {
        setShowAddError(true)
        setTimeout(() => setShowAddError(false), 2000)
      }
    }
  }, [addedUser, isLoadingAddUser, isErrorAddUser, onAddUser, addUserError])

  const getUser = event => {
    if (!eppn) {
      return
    }
    setUser('')
    event.preventDefault()
    void getUserFromSisuByEppnQuery(eppn)
  }

  const addUser = () => {
    if (!user) {
      return
    }
    void addUserMutation(user)
  }

  const cancelUser = () => {
    setUser('')
  }

  if (isLoadingGetUser) {
    return <Loading />
  }

  return (
    <>
      <Section title="Add new user">
        <Stack direction="row" gap={1} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            onChange={event => setEppn(event.target.value)}
            placeholder="Enter user eppn"
            size="small"
            sx={{ flex: 1 }}
            value={eppn}
          />
          <Button color="primary" endIcon={<SendIcon />} onClick={getUser} variant="contained">
            Fetch user from Sisu
          </Button>
        </Stack>
      </Section>
      {isErrorGetUser ? (
        <Alert severity="warning" variant="outlined">
          <Typography>Something went wrong, please try a different eppn</Typography>
        </Alert>
      ) : null}
      {showAdded ? (
        <Alert severity="success" variant="outlined">
          <Typography>Added user to the Oodikone user database</Typography>
        </Alert>
      ) : null}
      {showAddError ? (
        <Alert severity="error" variant="outlined">
          <Typography>The user already exists in Oodikone</Typography>
        </Alert>
      ) : null}
      {!isErrorGetUser && user ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>{user.eppn}</TableCell>
                <TableCell>
                  <Stack direction="row" gap={1}>
                    <Button color="inherit" onClick={cancelUser} variant="text">
                      Cancel
                    </Button>
                    <Button color="success" endIcon={<AddIcon />} onClick={addUser} variant="contained">
                      Add
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </>
  )
}
