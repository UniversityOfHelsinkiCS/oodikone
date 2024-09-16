import { useEffect, useState } from 'react'
import { Button, Form, FormGroup, Input, Loader, Segment } from 'semantic-ui-react'
import { useLazyGetUserFromSisuByEppnQuery, useAddUserMutation } from '@/redux/users'
import { SortableTable } from '../SortableTable'

export const NewUserSection = ({ onAddUser }) => {
  const [eppn, setEppn] = useState('')
  const [user, setUser] = useState('')
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
  }, [userFromApi, isLoadingGetUser, isErrorGetUser, isFetching])

  useEffect(() => {
    if (!isLoadingAddUser && !isErrorAddUser) {
      setUser('')
      setEppn('')
      onAddUser()
      if (addedUser) {
        setShowAdded(true)
        setTimeout(() => setShowAdded(false), 2000)
      }
    }
    if (isErrorAddUser) {
      if (addUserError.status === 400) {
        setShowAddError(true)
        setTimeout(() => setShowAddError(false), 2000)
      }
    }
  }, [addedUser, isLoadingAddUser, isErrorAddUser])

  const getUser = event => {
    if (!eppn) return
    setUser('')
    event.preventDefault()
    getUserFromSisuByEppnQuery(eppn)
  }

  const addUser = () => {
    if (!user) return
    addUserMutation(user)
  }

  const cancelUser = () => {
    setUser('')
  }

  if (isLoadingGetUser) return <Loader active inline="centered" />

  return (
    <Segment className="contentSegment">
      <Form>
        <FormGroup>
          <Input onChange={event => setEppn(event.target.value)} placeholder="Enter user eppn" value={eppn} />
          <Button color="blue" onClick={getUser}>
            Fetch user from Sisu
          </Button>
        </FormGroup>
      </Form>

      {isErrorGetUser && <h4>Something went wrong, please try a different eppn.</h4>}

      {showAdded && <h4> Added user to the Oodikone user-database.</h4>}

      {showAddError && <h4 style={{ color: 'red' }}>The user already exists in Oodikone.</h4>}

      {!isErrorGetUser && user && (
        <SortableTable
          columns={[
            {
              key: 'NAME',
              title: 'Name',
              sortable: false,
              filterable: false,
              getRowVal: user => {
                const name = user.first_name.concat(' ', user.last_name)
                return name
              },
              getRowContent: user => {
                const name = user.first_name.concat(' ', user.last_name)
                return name
              },
            },
            {
              key: 'USERNAME',
              title: 'Username',
              sortable: false,
              filterable: false,
              getRowVal: user => user.eppn,
              getRowContent: user => user.eppn,
            },
            {
              key: 'ADDUSER',
              title: 'Add user',
              sortable: false,
              filterable: false,
              getRowVal: () => (
                <Button color="green" onClick={addUser}>
                  Add
                </Button>
              ),
            },
            {
              key: 'CANCELUSER',
              title: 'Cancel',
              sortable: false,
              filterable: false,
              getRowVal: () => (
                <Button color="red" onClick={cancelUser}>
                  Cancel
                </Button>
              ),
            },
          ]}
          data={[user]}
          hideHeaderBar
          singleLine={false}
        />
      )}
    </Segment>
  )
}
