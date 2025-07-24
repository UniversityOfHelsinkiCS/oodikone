import LogoutIcon from '@mui/icons-material/Logout'
import RefreshIcon from '@mui/icons-material/Refresh'
import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { random } from 'lodash'
import ReactHighchart from 'react-highcharts'

import toskaLogo from '@/assets/toska.svg'
import { useTitle } from '@/hooks/title'
import { useLogoutMutation } from '@/redux/auth'

const names = [
  'mluukkai',
  'jakousa',
  'totutotu',
  'sasumaki',
  'ikuisma',
  'eero3',
  'mitiaine',
  'rimi',
  'esakemp',
  'woltsu',
  'cxcorp',
  'ajhaa',
  'joonashak',
  'vaahtokarkki',
  'otahontas',
  'saarasat',
  'popalmu',
  'ollikehy',
] as const

const dummyData = names.map(name => ({
  name,
  data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce((acc, i) => {
    acc[i] = (acc[i - 1] || 0) + (random(0, 3) === 0 ? 0 : random(10.0, 100.0))
    return acc
  }, [] as number[]),
  type: 'line' as const,
}))

export const ErrorBackground = ({ header, content }) => {
  useTitle(header)
  const [logout] = useLogoutMutation()

  return (
    <Box>
      <Container maxWidth="lg">
        <Stack sx={{ alignItems: 'stretch', height: '100vh', justifyContent: 'space-evenly' }}>
          <ReactHighchart
            config={{
              plotOptions: { series: { label: { connectorAllowed: false }, pointStart: 2010 } },
              series: dummyData,
              title: { text: 'Students of Computer Science 2018-2020' },
              yAxis: { title: { text: 'Cumulative credits' } },
            }}
          />
          <ReactHighchart
            config={{
              chart: { type: 'column' },
              series: dummyData.map(element => ({
                name: element.name,
                data: [Math.max(...element.data)],
                type: 'column',
              })),
              title: { text: "Your students' future" },
              xAxis: { categories: ['2018'] },
              yAxis: { title: { text: 'Cumulative credits' } },
            }}
          />
        </Stack>
      </Container>
      <Backdrop
        open
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.88)',
          color: 'white',
        }}
      >
        <Stack alignItems="center" gap={3}>
          <img
            alt="Toska logo"
            src={toskaLogo}
            style={{
              display: 'block',
              height: 'auto',
              width: '300px',
            }}
            title="Toska logo"
          />
          <Typography component="h1" variant="h5">
            {header}
          </Typography>
          <Typography component="p" variant="body1">
            {content}
          </Typography>
          <Stack direction="row" spacing={3}>
            <Button
              color="inherit"
              endIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              variant="outlined"
            >
              Refresh
            </Button>
            <Button
              color="error"
              endIcon={<LogoutIcon />}
              onClick={() => typeof logout === 'function' && logout()}
              variant="contained"
            >
              Log out
            </Button>
          </Stack>
        </Stack>
      </Backdrop>
    </Box>
  )
}
