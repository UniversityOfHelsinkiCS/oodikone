import { useEffect, useState } from 'react'
import { Form, FormGroup, Input, Button, Loader, Segment } from 'semantic-ui-react'
import { useLazyGetUserFromSisuByEppnQuery, useAddUserMutation } from '@/redux/users'
import { SortableTable } from '../SortableTable'

export const NewUserSection = ({ onAddUser }) => {
  const [eppn, setEppn] = useState('')
  const [user, setUser] = useState('')
  const [showTable, setShowTable] = useState(true)

  const [getUserFromSisuByEppnQuery, { data: userFromApi, isLoadingGetUser, isErrorGetUser }] =
    useLazyGetUserFromSisuByEppnQuery()
  const [addUserMutation, { data: addedUser, isLoadingAddUser, isErrorAddUser }] = useAddUserMutation()

  useEffect(() => {
    if (!isLoadingGetUser && !isErrorGetUser) {
      setUser(userFromApi)
      setShowTable(true)
    }
  }, [userFromApi, isLoadingGetUser, isErrorGetUser])

  useEffect(() => {
    if (!isLoadingAddUser && !isErrorAddUser) {
      setUser('')
      setEppn('')
      setShowTable(false)
      onAddUser()
    }
  }, [addedUser, isLoadingAddUser, isErrorAddUser])

  const handleEppnOnChange = (_, { value }) => {
    if (value) setEppn(value)
  }

  const getUser = event => {
    setShowTable(false)
    event.preventDefault()
    getUserFromSisuByEppnQuery(eppn)
    setUser(userFromApi)
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

      {showTable && user && (
        <SortableTable
          columns={[
            {
              key: 'NAME',
              title: 'Name',
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
              getRowVal: user => user.eppn,
              getRowContent: user => user.eppn,
            },
            {
              key: 'ADDUSER',
              title: 'Add user',
              getRowVal: () => (
                <Button color="green" onClick={addUser}>
                  Add
                </Button>
              ),
            },
            {
              key: 'CANCELUSER',
              title: 'Cancel',
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
