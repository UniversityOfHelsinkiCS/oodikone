import { useLocalStorage } from '@/hooks/localStorage'
import { useGetActiveBannersQuery } from '@/redux/banners'
import { Banner } from './Banner'

export const BannerView = () => {
  const [clearedBanners, setClearedBanners] = useLocalStorage<number[]>(`cleared-banners`, [])

  const { data: activeBanners } = useGetActiveBannersQuery()
  const clearBanner = (id: number) => {
    setClearedBanners(clearedBanners.includes(id) ? clearedBanners : [id, ...clearedBanners])
  }

  const visibleBanners = activeBanners?.filter(item => !clearedBanners.includes(item.id))

  if (!visibleBanners?.length) return null

  return (
    <>
      {visibleBanners.map(banner => (
        <Banner banner={banner} clearBanner={clearBanner} key={banner.id} />
      ))}
    </>
  )
}
