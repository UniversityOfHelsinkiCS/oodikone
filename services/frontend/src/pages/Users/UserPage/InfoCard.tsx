import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { isDefaultServiceProvider } from '@/common'
import { Link } from '@/components/material/Link'
import { MockButton } from '@/components/material/MockButton'
import { DateFormat } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { User } from '@/types/api/users'
import { reformatDate } from '@/util/timeAndDate'
import { getFullLanguage } from '@oodikone/shared/language'
import { CardHeader } from './CardHeader'
import { NotifyButton } from './NotifyButton'

export const InfoCard = ({ user }: { user: User }) => {
  const { username: currentUserName } = useGetAuthorizedUserQuery()

  return (
    <Card sx={{ width: '100%' }} variant="outlined">
      <CardHeader
        buttons={
          <>
            {user.username !== currentUserName && <MockButton username={user.username} />}
            {isDefaultServiceProvider() && <NotifyButton userEmail={user.email} />}
          </>
        }
        title={user.name}
      />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Language</TableCell>
                <TableCell>Last login</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <Link to={`mailto:${user.email}`}>{user.email}</Link>
                </TableCell>
                <TableCell>{getFullLanguage(user.language)}</TableCell>
                <TableCell>{reformatDate(user.lastLogin, DateFormat.DISPLAY_DATE)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}
