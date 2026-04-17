import { createContext, useContext } from 'react';

export const UXContext = createContext({
  notify: () => {},
  track: () => {},
});

export const useUX = () => useContext(UXContext);

