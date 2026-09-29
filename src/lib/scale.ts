import { ms, s, vs, mvs } from 'react-native-size-matters';

export const scale = {
  /** Moderate scale (Defaults to a factor of 0.5) */
  ms: (size: number, factor?: number) => ms(size, factor),
  
  /** Linear width scaling */
  w: (size: number) => s(size),
  
  /** Linear height scaling */
  h: (size: number) => vs(size),
  
  /** Moderate vertical scaling */
  mvs: (size: number, factor?: number) => mvs(size, factor),
};

export { ms, s, vs, mvs };