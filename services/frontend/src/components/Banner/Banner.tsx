/* eslint-disable no-alert */

import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { theme, ClearIcon, EditIcon, DeleteIcon } from '@/theme'

const getHexColor = (hue: string, lightness: string): string => {
  if (hue === 'white') return theme.palette.common.white
  if (hue === 'black') return theme.palette.common.black
  return theme.palette[hue][lightness]
}

const mockFun = (_: any) => {
  return
}

export const Banner = ({ banner, clearBanner = mockFun, deleteBanner = mockFun, adminView = false }) => {
  const { id, color, lightness, text } = banner

  const acualColor = getHexColor(color, lightness)
  const contrastColor = theme.palette.getContrastText(acualColor)
  return (
    <Paper
      elevation={5}
      sx={{
        width: '100%',
        textAlign: 'center',
        mt: 0,
        background: acualColor,
        color: contrastColor,
        padding: '0.3rem',
        borderRadius: 0,
        zIndex: 67,
      }}
      variant="elevation"
    >
      <Grid container spacing={2}>
        <Grid size={1} />

        <Grid size={10} sx={{ alignContent: 'center' }}>
          <Typography fontSize="1.1rem" variant="h6">
            {text}
          </Typography>
        </Grid>

        <Grid size={1}>
          {adminView ? (
            <Stack direction="row">
              <Tooltip arrow title="Modify">
                <IconButton onClick={_ => clearBanner(id)}>
                  <EditIcon htmlColor={contrastColor} />
                </IconButton>
              </Tooltip>
              <Tooltip arrow title="End visibility period immediately">
                <IconButton
                  onClick={_ => {
                    if (window.confirm('Delete banner?')) deleteBanner(id)
                  }}
                >
                  <DeleteIcon htmlColor={contrastColor} />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : (
            <Tooltip arrow title="Close and don't show again">
              <IconButton onClick={_ => clearBanner(id)}>
                <ClearIcon htmlColor={contrastColor} />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
      </Grid>
    </Paper>
  )
}
