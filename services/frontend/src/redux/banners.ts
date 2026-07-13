import { RTKApi } from '@/apiConnection'
import { Banner } from '@oodikone/shared/models/kone'

const bannerApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getActiveBanners: builder.query<Banner[], void>({
      query: () => ({ url: 'banners' }),
      providesTags: ['Banners'],
    }),
    getAllBanners: builder.query<Banner[], void>({
      query: () => ({ url: 'banners/all' }),
      providesTags: ['Banners'],
    }),
    createBanner: builder.mutation<void, Omit<Banner, 'id' | 'lastModifiedBy'>>({
      query: body => ({
        url: 'banners/new',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Banners'],
    }),
    updateBanner: builder.mutation<void, Banner>({
      query: body => ({
        url: 'banners/update',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Banners'],
    }),
  }),
})

export const { useGetActiveBannersQuery, useGetAllBannersQuery, useCreateBannerMutation, useUpdateBannerMutation } =
  bannerApi
