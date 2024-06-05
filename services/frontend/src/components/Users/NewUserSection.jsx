import { useEffect, useState } from 'react'
import { Form, FormGroup, Input, Button, Loader, Segment } from 'semantic-ui-react'
import { useLazyGetUserFromSisuByEppnQuery, useAddUserMutation } from '@/redux/users'
import { SortableTable } from '../SortableTable'

export const NewUserSection = ({ onAddUser }) => {
  const [eppn, setEppn] = useState('')
  const [user, setUser] = useState('')
  const [showAdded, setShowAdded] = useState(false)

  const [
    getUserFromSisuByEppnQuery,
    { data: userFromApi, isLoading: isLoadingGetUser, isError: isErrorGetUser, isFetching },
  ] = useLazyGetUserFromSisuByEppnQuery()
  const [addUserMutation, { data: addedUser, isLoading: isLoadingAddUser, isError: isErrorAddUser }] =
    useAddUserMutation()

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
      setShowAdded(true)
      setTimeout(() => setShowAdded(false), 2000)
    }
  }, [addedUser, isLoadingAddUser, isErrorAddUser])

  const handleEppnOnChange = (_, { value }) => {
    if (value) setEppn(value)
  }

  const getUser = event => {
    setUser('')
    event.preventDefault()
    getUserFromSisuByEppnQuery(eppn)
  }

  const addUser = () => {
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
          <Input onChange={handleEppnOnChange} placeholder="Enter user eppn" value={eppn} />
          <Button color="blue" onClick={getUser}>
            Fetch user from Sisu
          </Button>
        </FormGroup>
      </Form>

      {isErrorGetUser && <h4>Something went wrong, please try a different eppn.</h4>}

      {showAdded && addedUser && <h4> Added user to the Oodikone user-database.</h4>}

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
