import MUIBackdrop, { BackdropProps } from '@mui/material/Backdrop'

export const Backdrop = ({ open, children, ...props }: Omit<BackdropProps, 'unmountOnExit'>) => {
  if (!open) return null
  return (
    <MUIBackdrop hidden={false} open {...props}>
      {children}
    </MUIBackdrop>
  )
}
