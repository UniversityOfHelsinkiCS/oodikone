import { LanguageProvider } from '@/components/LanguagePicker/useLanguage'

export const CommonContext = ({ children }) => <LanguageProvider>{children}</LanguageProvider>
