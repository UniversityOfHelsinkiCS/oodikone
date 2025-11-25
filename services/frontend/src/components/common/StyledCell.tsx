import TableCell, { TableCellProps } from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'

type StyledCellProps = TableCellProps & {
  bold?: true
  light?: true
  text?: true
  sx?: TableCellProps['sx']
  typographyVariant?: React.ComponentProps<typeof Typography>['variant']
}

/**
 * @param bold - render a fontWeight bold Typography around children
 * @param light - render a fontWeight light Typography around children
 * @param text - render a regular Typography around children
 * @param info - render a ? icon with provided text to the right of the cell
 *
 * @default return a plain TableCell
 */
export const StyledCell = ({ bold, light, text, children, sx, typographyVariant, ...props }: StyledCellProps) => {
  const weight = bold ? 'bold' : light ? 'light' : undefined

  return (
    <TableCell sx={sx} {...props}>
      {weight || text ? (
        <Typography fontWeight={weight} variant={typographyVariant}>
          {children}
        </Typography>
      ) : (
        children
      )}
    </TableCell>
  )
}
