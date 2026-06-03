import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import ReactECharts from 'echarts-for-react'
import { random } from 'lodash-es'

import toskaLogo from '@/assets/toska.svg'
import { Backdrop } from '@/components/common/Backdrop'
import { PageLayout } from '@/components/common/PageLayout'
import { useTitle } from '@/hooks/title'
import { useLogoutMutation } from '@/redux/auth'
import { LogoutIcon, RefreshIcon } from '@/theme'

const dummyData = [...Array(18).keys()].map(_ =>
  [...Array(new Date().getFullYear() - 2016).keys()].reduce<number[]>((acc, i) => {
    acc[i] = (acc[i - 1] || 0) + (random(0, 3) === 0 ? 0 : random(10.0, 100.0))
    return acc
  }, [])
)

export const ErrorBackground = ({ header, content }) => {
  useTitle(header)
  const logout = useLogoutMutation()
  const yearLabels = dummyData[0]?.map((_, index) => (2017 + index).toString()) ?? []

  return (
    <PageLayout maxWidth="lg" width="100%">
      <Stack sx={{ alignItems: 'stretch', height: '100vh', justifyContent: 'space-evenly' }}>
        <ReactECharts
          option={{
            title: {
              text: `Students of Computer Science 2017-${new Date().getFullYear()}`,
            },
            tooltip: {
              trigger: 'axis',
            },
            grid: {
              left: 40,
              right: 20,
              top: 40,
              bottom: 30,
              containLabel: true,
            },
            xAxis: {
              type: 'category',
              data: yearLabels,
            },
            yAxis: {
              type: 'value',
              name: 'Cumulative credits',
            },
            series: dummyData.map(data => ({
              type: 'line',
              data,
            })),
          }}
          opts={{ renderer: 'svg' }}
          style={{ height: 300, width: '100%' }}
        />
        <ReactECharts
          option={{
            title: {
              text: "Your students' future",
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow',
              },
            },
            grid: {
              left: 40,
              right: 20,
              top: 40,
              bottom: 30,
              containLabel: true,
            },
            xAxis: {
              type: 'category',
              data: ['2018'],
            },
            yAxis: {
              type: 'value',
              name: 'Cumulative credits',
            },
            series: dummyData.map(data => ({
              type: 'bar',
              data: [Math.max(...data)],
            })),
          }}
          opts={{ renderer: 'svg' }}
          style={{ height: 300, width: '100%' }}
        />
      </Stack>
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
    </PageLayout>
  )
}
