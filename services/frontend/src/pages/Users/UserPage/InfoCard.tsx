import {
  Card,
  CardContent,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Link } from 'react-router'

import { isDefaultServiceProvider } from '@/common'
import { MockButton } from '@/components/material/MockButton'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { getFullLanguage } from '@/shared/language'
import { reformatDate } from '@/util/timeAndDate'
import { NotifyButton } from './NotifyButton'

export const InfoCard = ({ user }) => {
  const { username: currentUserName } = useGetAuthorizedUserQuery()

  return (
    <Card sx={{ width: '100%' }} variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between">
          <Typography component="h2" variant="h5">
            {user.name}
          </Typography>
          <Stack direction="row" gap={1}>
            {user.username !== currentUserName && <MockButton username={user.username} />}
            {isDefaultServiceProvider() && <NotifyButton />}
          </Stack>
        </Stack>
      </CardContent>
      <Divider />
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
                <TableCell>{reformatDate(user.lastLogin, DISPLAY_DATE_FORMAT)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}
