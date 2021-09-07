import { compareByAlphabetical, sortNameByAlphaBet } from '../sorting';

describe('utils > sorting', () => {
  describe('func compareByAlphabetical', () => {
    it('return 0 if same', () => {
      const result = compareByAlphabetical('a', 'a');
      expect(result).toBe(0);
    });

    it('return -1 if next larger than prev', () => {
      const result = compareByAlphabetical('a', 'b');
      expect(result).toBe(-1);
    });

    it('return 1 if next smaller than prev', () => {
      const result = compareByAlphabetical('c', 'b');
      expect(result).toBe(1);
    });
  });

  describe('func sortNameByAlphaBet', () => {
    it('sort list properly by displayName', () => {
      const items = [
        {
          displayName: 'c',
        },
        {
          displayName: 'A',
        },
        {
          displayName: 'a',
        },
        {
          displayName: 'z',
        },
        {
          displayName: 'x',
        },
      ];
      const expected = [
        {
          displayName: 'A',
        },
        {
          displayName: 'a',
        },
        {
          displayName: 'c',
        },
        {
          displayName: 'x',
        },
        {
          displayName: 'z',
        },
      ];
      const result = sortNameByAlphaBet(items);
      expect(result).toEqual(expected);
    });

    it('sort list properly by name', () => {
      const items = [
        {
          name: 'c',
        },
        {
          name: 'A',
        },
        {
          name: 'a',
        },
        {
          name: 'z',
        },
        {
          name: 'x',
        },
      ];
      const expected = [
        {
          name: 'A',
        },
        {
          name: 'a',
        },
        {
          name: 'c',
        },
        {
          name: 'x',
        },
        {
          name: 'z',
        },
      ];
      const result = sortNameByAlphaBet(items);
      expect(result).toEqual(expected);
    });
  });
});
