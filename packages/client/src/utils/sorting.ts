export const compareByAlphabetical = (prev: string, next: string) => {
  if (prev < next) return -1;
  if (prev > next) return 1;
  return 0;
};

export const sortNameByAlphaBet = (items: any[]): any[] => {
  const copiedItems = items.slice();
  copiedItems
    .sort((prev, next) => {
      const prevName = prev.displayName || prev.name;
      const nextName = next.displayName || next.name;
      return compareByAlphabetical(prevName, nextName);
    });
  return copiedItems;
};
