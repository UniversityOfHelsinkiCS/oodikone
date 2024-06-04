/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react'
import { Form, FormGroup, Input, Button, Loader, Segment } from 'semantic-ui-react'
import { useLazyGetUserFromSisuByEppnQuery, useAddUserMutation } from '@/redux/users'
import { SortableTable } from '../SortableTable'

export const NewUserSection = ({ onAddUser }) => {
  const [eppn, setEppn] = useState('olliperson@gmail.com')
  const [user, setUser] = useState('')

  const [getUserFromSisuByEppnQuery, { data: userFromApi, isLoading, isError }] = useLazyGetUserFromSisuByEppnQuery()
  const [addUserMutation, { data }] = useAddUserMutation()

  useEffect(() => {
    setUser(userFromApi)
  }, [userFromApi])

  const handleEppnOnChange = (_, { value }) => {
    if (value) setEppn(value)
  }

  const megayYhyy = event => {
    event.preventDefault()
    getUserFromSisuByEppnQuery(eppn)
    setUser(userFromApi)
  }

  const addUser = () => {
    addUserMutation(user)
    onAddUser()
  }

  const cancelUser = () => {
    setUser('')
  }

  if (isLoading) return <Loader active inline="centered" />

  return (
    <Segment className="contentSegment">
      <Form>
        <FormGroup>
          <Input onChange={handleEppnOnChange} placeholder="jee" value={eppn} />
          <Button onClick={megayYhyy}>Jee</Button>
        </FormGroup>
      </Form>

      {isError && <h4>Something went wrong try different eppn.</h4>}

      {user && (
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
              getRowVal: () => <Button onClick={addUser}>Add</Button>,
            },
            {
              key: 'CANCELUSER',
              title: 'Cancel user',
              getRowVal: () => <Button onClick={cancelUser}>Cancel</Button>,
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
