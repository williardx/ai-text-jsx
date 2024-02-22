import { useEffect, useState, useRef } from "react";
import type { LLMComponent } from "../types";

interface StateHistoryTrackerProps {
  onStateHistoryChange: (stateHistory: any[]) => void;
  component: LLMComponent;
}

export default function StateHistoryTracker({
  onStateHistoryChange,
  component: Component,
}: StateHistoryTrackerProps) {
  const [stateHistory, setStateHistory] = useState<any[]>([]);
  const prevHistoryLengthRef = useRef<number>(0);

  useEffect(() => {
    if (stateHistory.length === prevHistoryLengthRef.current) return;
    onStateHistoryChange(stateHistory);
    prevHistoryLengthRef.current = stateHistory.length;
  }, [stateHistory, onStateHistoryChange]);

  const callback = (state: any) => {
    setStateHistory((prev) => [...prev, state]);
  };

  return <Component callback={callback} />;
}
