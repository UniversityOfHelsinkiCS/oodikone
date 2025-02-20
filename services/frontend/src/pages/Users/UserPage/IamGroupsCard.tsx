import { Card, CardContent, Chip, Stack } from '@mui/material'

import { User } from '@/types/api/users'
import { CardHeader } from './CardHeader'

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
