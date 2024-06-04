import { Form, FormGroup, Input } from 'semantic-ui-react'
import { useGetUserFromSisuByEppnQuery } from '@/redux/users'

export const NewUserSection = () => {
  const { data: user, isLoading, isError, error } = useGetUserFromSisuByEppnQuery('funfun')
  // eslint-disable-next-line no-console
  console.log(user, isLoading, isError, error)

  return (
    <Form>
      <FormGroup>
        <Input disabled="false" placeholder="jee" value="jee" />
      </FormGroup>
    </Form>
  )
}
