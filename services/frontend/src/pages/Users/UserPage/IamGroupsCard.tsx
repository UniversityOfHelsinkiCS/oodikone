import { Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'

import { User } from '@/types/api/users'

export const IamGroupsCard = ({ user }: { user: User }) => {
  return (
    <Card sx={{ height: '100%', width: '100%' }} variant="outlined">
      <CardContent>
        <Typography component="h2" variant="h5">
          IAM Groups
        </Typography>
      </CardContent>
      <Divider />
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
