import { renderHook, act } from '@testing-library/react-hooks';
import { useLocalStorage } from './useLocalStorage';

beforeEach(() => {
  // mock console.warn
  console.warn = () => ({});
});

describe('useLocalStorage', () => {
  it('should get the initial localStorage value with the given key', () => {
    const { result } = renderHook(() => useLocalStorage('foo', []));

    expect(result.current[0]).toEqual([]);
  });

  it('should get the value by key from localStorage', () => {
    window.localStorage.setItem('foo', JSON.stringify(['a', 'b', 'c']));

    const { result } = renderHook(() => useLocalStorage('foo', []));

    expect(result.current[0]).toEqual(['a', 'b', 'c']);
  });

  it('should get initial value when encounter get key error', () => {
    window.localStorage.getItem = undefined;

    const { result } = renderHook(() => useLocalStorage('foo', []));

    expect(result.current[0]).toEqual([]);
  });

  it('should set values to the given localStorage key', () => {
    const { result } = renderHook(() => useLocalStorage('foo', []));

    act(() => {
      result.current[1](['a', 'b', 'c']);
    });

    expect(result.current[0]).toEqual(['a', 'b', 'c']);
  });
});
