import { OpenInNew } from '@mui/icons-material'
import { Link } from '@mui/material'

/**
 * Link that opens an external website in a new tab
 *
 * @param href - URL of the external website
 * @param text - Text to display in the link
 */
export const ExternalLink = ({ href, text }: { href: string; text: string }) => {
  return (
    <Link
      href={href}
      rel="noopener noreferrer"
      sx={{ alignItems: 'center', display: 'flex', gap: 0.5 }}
      target="_blank"
      variant="body2"
    >
      {text}
      <OpenInNew fontSize="inherit" />
    </Link>
  )
}
