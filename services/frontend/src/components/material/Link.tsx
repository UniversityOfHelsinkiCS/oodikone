import LinkContainer from '@mui/material/Link'
import { Link as RouterLink } from 'react-router'

export const Link = props => <LinkContainer component={RouterLink} {...props} />
