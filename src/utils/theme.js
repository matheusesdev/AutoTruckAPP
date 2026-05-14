// src/utils/theme.js
import { Platform } from 'react-native';

export const theme = {
  // ─── Cores ───
  colors: {
    primary: '#1B3A6B',     // Azul Escuro
    accent: '#E87722',      // Laranja
    background: '#FFFFFF',  // Branco
    text: '#1A1A1A',        // Quase Preto
    error: '#EF4444',       // Vermelho para erros
    border: '#E2E8F0',      // Cinza claro para bordas
    inputBackground: '#F8FAFC', // Cinza muito claro para fundo de inputs
    disabled: '#E2E8F0',    // Cinza para botões desabilitados
    disabledText: '#94A3B8', // Texto de botão desabilitado
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    overlay: 'rgba(0,0,0,0.6)',
    success: '#30D158',
    warning: '#FFD60A',
    info: '#0A84FF',
    primaryAlpha10: 'rgba(255, 149, 0, 0.10)',   // laranja AutoTruck 10% opacidade
    accentAlpha15: 'rgba(10, 132, 255, 0.15)'    // azul info 15% opacidade
  },

  // ─── Espaçamento ───
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // ─── Border Radius ───
  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    full: 999,
  },

  // ─── Sombras ───
  shadow: {
    sm: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: {
        elevation: 14,
      },
    }),
  },

  // ─── Tipografia ───
  typography: {
    h1:        { fontSize: 28, fontWeight: '800', lineHeight: 34 },
    h2:        { fontSize: 22, fontWeight: '700', lineHeight: 28 },
    h3:        { fontSize: 18, fontWeight: '600', lineHeight: 24 },
    body:      { fontSize: 15, fontWeight: '400', lineHeight: 22 },
    bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
    caption:   { fontSize: 11, fontWeight: '400', lineHeight: 16 },
    label:     { fontSize: 12, fontWeight: '600', lineHeight: 16, letterSpacing: 0.5 },
  },
};

export default theme;

