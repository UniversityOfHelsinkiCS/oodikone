import { Section } from '@/components/Section'
import { ReduxWrapper } from '../../ReduxWrapper'

export const SectionWrapper = ({ title }: { title?: string }) => (
  <ReduxWrapper
    component={
      <Section cypress="test" title={title}>
        Content
      </Section>
    }
  />
)
