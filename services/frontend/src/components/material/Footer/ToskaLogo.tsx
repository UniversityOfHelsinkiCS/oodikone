import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { images } from '@/common'

export const ToskaLogo = () => {
  return (
    <Stack alignItems="center">
      <a href="https://toska.dev" rel="noopener noreferrer" target="_blank">
        <img
          alt="Toska logo"
          src={images.toskaLogo}
          style={{
            display: 'block',
            height: 'auto',
            width: '100px',
          }}
          title="Toska logo"
        />
      </a>
      <Typography color="text.secondary" variant="caption">
        Developed by Toska
      </Typography>
    </Stack>
  )
}
