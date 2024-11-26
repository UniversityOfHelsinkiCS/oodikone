export interface Name {
  fi?: string
  en?: string
  sv?: string
}

export interface NameWithCode extends Name {
  code: string
}
