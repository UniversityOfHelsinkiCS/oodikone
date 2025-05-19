import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/redux'

// Pre typed versions of useDispatch and useSelector to use across the app
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
