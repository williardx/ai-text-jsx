import { ComponentType } from "react";

interface LLMComponentProps {
  callback: (state: any) => void;
}

export type LLMComponent = ComponentType<LLMComponentProps>;

export interface TextMessage {
  user: "user" | "assistant";
  type: "text";
  content: string;
}

export interface ComponentMessage {
  user: "assistant";
  type: "component";
  content: LLMComponent;
  stateHistory?: any[];
  jsx: string;
}

export type Message = TextMessage | ComponentMessage;
