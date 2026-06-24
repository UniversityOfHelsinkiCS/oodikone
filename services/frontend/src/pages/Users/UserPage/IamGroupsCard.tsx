import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'

import { CardHeader } from '@/pages/Users/UserPage/CardHeader'
import { User } from '@/types/api/users'

export const IamGroupsCard = ({ user }: { user: User }) => {
  return (
    <Card sx={{ height: '100%', width: '100%' }} variant="outlined">
      <CardHeader title="IAM Groups" />
      <CardContent>
        <Stack direction="column" gap={1}>
          {user.iamGroups.toSorted().map(iamGroup => (
            <Chip key={iamGroup} label={iamGroup} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
