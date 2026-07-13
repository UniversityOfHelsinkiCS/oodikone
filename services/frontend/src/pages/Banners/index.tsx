import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'
import { useState } from 'react'
import { Banner } from '@/components/Banner/Banner'
import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { Section } from '@/components/Section'
import { useTitle } from '@/hooks/title'
import { useCreateBannerMutation, useGetAllBannersQuery, useUpdateBannerMutation } from '@/redux/banners'
import { Banner as TBanner } from '@oodikone/shared/models/kone'
import { BannerEditForm } from './EditForm'

const bannerInfoText = `
Banners are visible to all Oodikone users.

To locally make a closed banner visible again, nuke "cleared-banners" key from local storage.
`

export const Banners = () => {
  useTitle('Manage banners')
  const { data: allBanners } = useGetAllBannersQuery()
  const [createBanner] = useCreateBannerMutation()
  const [modifyBanner] = useUpdateBannerMutation()

  const [formOpen, setFormOpen] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<Partial<TBanner> | null>(null)
  const now = dayjs()

  const activeBanners = allBanners?.filter(b => now.isAfter(dayjs(b.startDate)) && now.isBefore(dayjs(b.endDate)))
  const scheduledBanners = allBanners?.filter(b => now.isBefore(dayjs(b.startDate)) && b.startDate < b.endDate)

  const openEditor = (b: Partial<TBanner> | null) => {
    setSelectedBanner(b)
    setFormOpen(true)
  }

  const onClose = () => {
    setFormOpen(false)
    setSelectedBanner(null)
  }

  // Handler for POST/PUT/"DELETE" (which is also PUT)
  const onSave = (values: TBanner, setToEnd = false, isNew = false) => {
    if (setToEnd) {
      void modifyBanner({
        ...values,
        endDate: new Date(),
      })
    } else if (isNew) {
      void createBanner(values)
    } else {
      void modifyBanner(values)
    }
    onClose()
  }

  return (
    <>
      <Dialog component="div" fullWidth onClose={onClose} open={formOpen} sx={{ bgcolor: '#00000080' }}>
        <BannerEditForm initialValues={selectedBanner} onSave={onSave} />
      </Dialog>

      <PageLayout maxWidth="lg">
        <PageTitle title="Manage banners" />
        <Stack spacing={3}>
          <Box>
            <Button onClick={() => openEditor(null)} variant="contained">
              Create new
            </Button>
          </Box>

          <Section infoBoxContent={bannerInfoText} title="Currently active banners">
            {activeBanners?.length ? (
              activeBanners.map(banner => (
                <Box key={banner.id} sx={{ p: 1, mt: 2, border: '1px solid #e0e0e0' }}>
                  <Banner
                    adminView
                    banner={banner}
                    clearBanner={() => openEditor(banner)}
                    deleteBanner={() => onSave(banner, true)}
                  />
                  <Typography fontWeight="normal" sx={{ mt: 1 }}>
                    {`Visible: ${new Date(banner.startDate).toLocaleString()} - ${new Date(banner.endDate).toLocaleString()}.
              Latest modification by: ${banner.lastModifiedBy}.`}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography>No currently active banners</Typography>
            )}
          </Section>
          <Section title="Scheduled (not yet visible) banners">
            {scheduledBanners?.length ? (
              scheduledBanners.map(banner => (
                <Box key={banner.id} sx={{ p: 1, mt: 2, border: '1px solid #e0e0e0' }}>
                  <Banner
                    adminView
                    banner={banner}
                    clearBanner={() => openEditor(banner)}
                    deleteBanner={() => onSave(banner, true)}
                  />
                  <Typography fontWeight="normal" sx={{ mt: 1 }}>
                    {`Visible: ${new Date(banner.startDate).toLocaleString()} - ${new Date(banner.endDate).toLocaleString()}.
              Latest modification by: ${banner.lastModifiedBy}.`}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography>No scheduled banners</Typography>
            )}
          </Section>
        </Stack>
      </PageLayout>
    </>
  )
}
