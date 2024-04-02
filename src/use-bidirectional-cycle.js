import { useCallback, useRef, useState } from "react";

export default function useBidirectionalCycle(...items) {
  const index = useRef(0);
  const [item, setItem] = useState(items[index.current]);

  const incrementCycle = useCallback(() => {
    index.current = (index.current + 1) % items.length;
    setItem(items[index.current]);
  }, [items]);
  const decrementCycle = useCallback(() => {
    index.current = index.current - 1;
    if (index.current === -1) index.current = items.length - 1;
    setItem(items[index.current]);
  }, [items]);

  return [item, incrementCycle, decrementCycle];
}
