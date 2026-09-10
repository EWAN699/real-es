'use client';

import { useEffect, useLayoutEffect } from 'react';

/** useLayoutEffect that does not warn during SSR. */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
