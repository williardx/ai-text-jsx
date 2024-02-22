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

  const callback = (state: any) => {
    setStateHistory((prev) => {
      const newState = [...prev, state];
      onStateHistoryChange(newState);
      return newState;
    });
  };

  return <Component callback={callback} />;
}
