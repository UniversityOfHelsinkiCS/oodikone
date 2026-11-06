import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { PanelView } from '@/components/common/PanelView'
import { useLinkedTabs } from '@/hooks/tabs'
import { ReduxWrapper } from '../../ReduxWrapper'

const TabbedContent = () => {
  const [tab, setTab] = useLinkedTabs(['first', 'second'])
  return (
    <>
      <Tabs onChange={(_, value: number) => setTab(value)} value={tab}>
        <Tab label="First tab" />
        <Tab label="Second tab" />
      </Tabs>
      Credit statistics content, tab {tab}
    </>
  )
}

export const PanelViewWrapper = ({ linkable, tall = false }: { linkable?: boolean; tall?: boolean }) => (
  <ReduxWrapper
    component={
      <>
        {tall ? <div style={{ height: '150vh' }} /> : null}
        <PanelView
          linkable={linkable}
          panels={[
            { title: 'Credit statistics', content: <TabbedContent /> },
            null,
            {
              title: 'Students (12)',
              anchorId: 'students',
              content: tall ? <div style={{ height: '200vh' }}>Students content</div> : 'Students content',
            },
          ]}
        />
      </>
    }
  />
)
