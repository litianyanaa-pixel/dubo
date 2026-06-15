import { create } from 'zustand'

export interface CountrySnapshot {
  id: string
  name: string
  currencyId: string
  gdpGrowth: number
  interestRate: number
  inflation: number
  satisfaction: number
  stability: number
  capitalFlow: number
  bondYield: number
}

export interface WarInfo {
  attacker: string
  defender: string
  phase: string
  scoreA: number
  scoreD: number
}

interface CountryStoreState {
  countries: Record<string, CountrySnapshot>
  activeWars: WarInfo[]
  relations: Record<string, Record<string, number>>
}

interface CountryStoreActions {
  setCountries: (countries: CountrySnapshot[]) => void
  setWars: (wars: WarInfo[]) => void
  setRelations: (relations: Record<string, Record<string, number>>) => void
}

export const useCountryStore = create<CountryStoreState & CountryStoreActions>((set) => ({
  countries: {},
  activeWars: [],
  relations: {},

  setCountries: (countries) =>
    set({
      countries: Object.fromEntries(countries.map(c => [c.id, c])),
    }),

  setWars: (activeWars) => set({ activeWars }),

  setRelations: (relations) => set({ relations }),
}))
