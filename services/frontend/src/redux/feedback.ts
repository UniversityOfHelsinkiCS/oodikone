import { RTKApi } from '@/apiConnection'

const feedbackApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    sendFeedback: builder.mutation<void, { content: string }>({
      query: ({ content }) => ({
        url: '/feedback/email',
        method: 'POST',
        body: { content },
      }),
    }),
  }),
  overrideExisting: false,
})

export const { useSendFeedbackMutation } = feedbackApi
