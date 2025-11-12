import { languageCenterViewToolTips } from '@/common/InfoToolTips'
import { InfoBox as MDInfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'

export const InfoBox = () => {
  const content = `${languageCenterViewToolTips.main}\n${open ? languageCenterViewToolTips.open : ''}\n${languageCenterViewToolTips.footer}`

  return <MDInfoBox content={content} />
}
