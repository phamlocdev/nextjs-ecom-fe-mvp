'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
      clear: () => set({ activeCartId: null }),
      markHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'customer-active-cart',
      partialize: (state) => ({ activeCartId: state.activeCartId }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated()
      },
    },
  ),
)
