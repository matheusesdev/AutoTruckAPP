import { create } from 'zustand';

// Store global de sessão do usuário em memória.
// O token e os dados também são persistidos no AsyncStorage na tela de Login.
const useUserStore = create((set) => ({
  token: null,
  user: null,

  setAuthData: ({ token, user }) =>
    set({
      token: token || null,
      user: user || null,
    }),

  clearAuthData: () =>
    set({
      token: null,
      user: null,
    }),
}));

export default useUserStore;
