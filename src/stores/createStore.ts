/**
 * Lightweight, zero-dependency store creator conforming to the Zustand API.
 * Uses React 19's native useSyncExternalStore for optimal tearing-free rendering.
 * Reference: docs/ARCHITECTURE.md Section 2 & .agents/rules/architecture.md Section 4
 */

import { useSyncExternalStore } from 'react';

export type Listener = () => void;

export type StateSetter<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>),
  replace?: boolean
) => void;

export type StateGetter<T> = () => T;

export interface StoreApi<T> {
  getState: StateGetter<T>;
  setState: StateSetter<T>;
  subscribe: (listener: Listener) => () => void;
}

export type StateCreator<T> = (set: StateSetter<T>, get: StateGetter<T>) => T;

export interface UseStore<T> {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState: StateGetter<T>;
  setState: StateSetter<T>;
  subscribe: (listener: Listener) => () => void;
}

export function createStore<T extends object>(initializer: T | StateCreator<T>): UseStore<T> {
  let state: T;
  const listeners = new Set<Listener>();

  const getState: StateGetter<T> = () => state;

  const setState: StateSetter<T> = (partial, replace = false) => {
    const nextPartial = typeof partial === 'function' ? partial(state) : partial;
    const nextState = replace ? (nextPartial as T) : Object.assign({}, state, nextPartial);

    if (!Object.is(nextState, state)) {
      state = nextState;
      listeners.forEach((listener) => listener());
    }
  };

  const subscribe = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  if (typeof initializer === 'function') {
    state = (initializer as StateCreator<T>)(setState, getState);
  } else {
    state = initializer;
  }

  function useStore(): T;
  function useStore<U>(selector: (state: T) => U): U;
  function useStore<U>(selector?: (state: T) => U): T | U {
    return useSyncExternalStore(
      subscribe,
      () => (selector ? selector(state) : state),
      () => (selector ? selector(state) : state)
    );
  }

  useStore.getState = getState;
  useStore.setState = setState;
  useStore.subscribe = subscribe;

  return useStore;
}
