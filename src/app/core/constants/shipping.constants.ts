// TODO: Implementar sistema dinámico de shipping basado en región/país
// Por ahora usamos una tarifa fija para consistencia entre cart y checkout
export const SHIPPING_CONSTANTS = {
  DEFAULT_SHIPPING_COST: 115.00, // $115.00 - Tarifa internacional estándar
  DEFAULT_SHIPPING_LOCATION: 'Peru',
  FREE_SHIPPING_THRESHOLD: 200.00 // Umbral para envío gratuito (para uso futuro)
} as const;

// Interfaz para futuras implementaciones dinámicas
export interface ShippingRate {
  country: string;
  rate: number;
}

// Configuración futura para shipping dinámico
export const FUTURE_SHIPPING_RATES: ShippingRate[] = [
  { country: 'IT', rate: 0 },      // Envío gratuito en Italia
  { country: 'US', rate: 25 },     // $25 a Estados Unidos
  { country: 'GB', rate: 20 },     // $20 a Reino Unido
  { country: 'FR', rate: 15 },     // $15 a Francia
  { country: 'DE', rate: 15 },     // $15 a Alemania
  { country: 'ES', rate: 12 },     // $12 a España
  { country: 'PE', rate: 115 },    // $115 a Perú
  { country: 'OTHER', rate: 30 }   // $30 para otros países
];

// Configuración global de moneda
export const CURRENCY_CONFIG = {
  CODE: 'USD',
  SYMBOL: '$',
  LOCALE: 'en-US' // Formato estadounidense para USD
} as const;

// Función utilitaria para formatear moneda de forma consistente
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY_CONFIG.LOCALE, {
    style: 'currency',
    currency: CURRENCY_CONFIG.CODE
  }).format(amount);
}

// Función utilitaria simple para formatear dólares (para templates que usan .toFixed(2))
export function formatDollar(amount: number): string {
  return `${CURRENCY_CONFIG.SYMBOL}${amount.toFixed(2)}`;
} 