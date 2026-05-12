import { create } from 'zustand';

const useNotificacaoStore = create((set) => ({
  notificacoes: [],

  adicionarNotificacao: (notificacao) =>
    set((state) => ({
      notificacoes: [
        {
          id: Date.now(),
          tipo: 'info', // 'info', 'sucesso', 'erro', 'aviso'
          mensagem: '',
          duracao: 3000,
          ...notificacao,
        },
        ...state.notificacoes,
      ],
    })),

  removerNotificacao: (id) =>
    set((state) => ({
      notificacoes: state.notificacoes.filter((n) => n.id !== id),
    })),

  limparNotificacoes: () => set({ notificacoes: [] }),
}));

export default useNotificacaoStore;
