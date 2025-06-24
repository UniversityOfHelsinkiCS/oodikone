import { PopulationQueryCard } from '@/components/PopulationQueryCard'

export const PopulationSearchHistory = ({ query, skipQuery }) => (
  <div style={{ marginRight: '2rem', marginTop: '1rem' }}>
    <PopulationQueryCard query={query} skipQuery={skipQuery} />
  </div>
)
