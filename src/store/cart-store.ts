'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const ACTIVE_CART_STORAGE_KEY = 'customer-active-cart'

type CartStore = {
  activeCartId: string | null
  isHydrated: boolean
  setActiveCartId: (cartId: string | null) => void
  clear: () => void
  markHydrated: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      activeCartId: null,
      isHydrated: false,
      setActiveCartId: (cartId) => set({ activeCartId: cartId }),
      clear: () => {
        set({ activeCartId: null })
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(ACTIVE_CART_STORAGE_KEY)
        }
      },
      markHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: ACTIVE_CART_STORAGE_KEY,
      partialize: (state) => ({ activeCartId: state.activeCartId }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated()
      },
    },
  ),
)
