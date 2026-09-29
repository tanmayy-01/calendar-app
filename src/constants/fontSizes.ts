import { scale } from "@/lib/scale";

export const FONT_SIZES = {
  xs: scale.ms(12),
  sm: scale.ms(14),
  md: scale.ms(16),
  lg: scale.ms(18),
  xl: scale.ms(20),
  xxl: scale.ms(24),
  xxxl: scale.ms(28),
  huge: scale.ms(32),
} as const;
