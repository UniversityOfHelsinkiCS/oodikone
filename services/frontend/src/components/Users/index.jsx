import { useParams } from 'react-router-dom'
import { Header } from 'semantic-ui-react'

import { useTitle } from '@/common/hooks'
import { NewUserSection } from './NewUserSection'
import { UserPage } from './UserPage'
import { UserSearchList } from './UserSearchList'

export const Users = () => {
  useTitle('Users')
  const { userid } = useParams()

  // TODO: After OOD-9 merged this should be removed and used the real one
  const isDefaultProvider = () => {
    return false
  }

  return (
    <div className="segmentContainer" style={{ marginBottom: '10px' }}>
      <Header className="segmentTitle" size="large">
        Oodikone users
      </Header>
      {!userid && !isDefaultProvider() && <NewUserSection />}
      {userid ? <UserPage /> : <UserSearchList />}
    </div>
  )
}
