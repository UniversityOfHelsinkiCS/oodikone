import formreducer from './common/formreducer'

const prefix = 'OODILEARN_POPULATION_FORM'

export const options = [
  { value: 'above', text: 'Above' },
  { value: 'average', text: 'Average' },
  { value: 'below', text: 'Above' }
]

export const fields = {
  SBI: 'SBI',
  SE: 'SE',
  Deep: 'Deep',
  Surface: 'Surface',
  Organised: 'Organised'
}

const reducer = formreducer(prefix)

export const { setValue, clear } = reducer

export default reducer.reducer
