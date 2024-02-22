"use client";

import React, { useState, useRef } from "react";
import LoadingSpinner from "./LoadingSpinner";
import StateHistoryTracker from "./StateHistoryTracker";
import type { LLMComponent, Message } from "../types";

export default function Chat() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleError = (err: Error | string) => {
    console.error(err);
    alert("An error occurred. Please try again.");
    setLoading(false);
  };

  const handleSend = async () => {
    const inputText = inputRef.current?.value;
    if (!inputText) return;
    inputRef.current.value = "";

    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { type: "text", content: inputText || "", user: "user" },
    ]);

    let res: Response;
    try {
      res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          inputText,
          messageHistory: messages.map((m, idx) => ({
            content:
              m.type === "text"
                ? m.content
                : `Component: ${
                    m.jsx
                  }\n\nUser interaction history: ${JSON.stringify(
                    m.stateHistory ?? [],
                  )} }`,
            role: m.user,
          })),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      const error = err as Error;
      handleError(error);
      return;
    }

    const data = await res.json();
    if (res.status !== 200) {
      handleError(data.error || "An unknown error occurred.");
      return;
    }

    setLoading(false);

    if (data.type === "text") {
      setMessages((prev) => [
        ...prev,
        {
          type: "text",
          content: data.content,
          user: "assistant",
        },
      ]);
    } else {
      const ComponentFunction = new Function(
        "React",
        `return ${data.component}`,
      )(React);

      setMessages((prev) => [
        ...prev,
        {
          type: "component",
          content: ComponentFunction,
          user: "assistant",
          jsx: data.jsx,
        },
      ]);
    }
  };

  console.log(messages);

  return (
    <div className="flex flex-col items-center gap-6 border-4 border-gray-500 max-w-screen-sm w-full h-[700px] rounded justify-between">
      <div className="flex self-start flex-col gap-6 overflow-y-scroll w-full text-lg p-8 pb-0">
        {messages.length > 0 &&
          messages.map((message, i) => {
            if (message.type === "text") {
              return (
                <div key={`${message.type}-${message.user}-${i}`}>
                  <span
                    className={`font-bold ${
                      message.user === "assistant" ? "text-blue-600" : ""
                    }`}
                  >
                    {message.user}
                  </span>
                  : {message.content as string}
                </div>
              );
            } else if (message.type === "component") {
              const LLMComponent = message.content as LLMComponent;
              const onStateHistoryChange = (stateHistory: any[]) => {
                // Update the message to include the state history
                // so that we can send it back to the LLM.
                if (stateHistory.length === 0) return;
                setMessages((prev) => {
                  const updatedMessages = [...prev];
                  const currentMessage = updatedMessages[i];
                  if (currentMessage.type !== "component")
                    return updatedMessages;
                  updatedMessages[i] = {
                    ...currentMessage,
                    stateHistory,
                  };
                  return updatedMessages;
                });
              };
              return (
                <div
                  className="flex flex-col gap-2"
                  key={`${message.type}-${message.user}-${i}`}
                >
                  <div
                    className={`font-bold ${
                      message.user === "assistant" ? "text-blue-600" : ""
                    }`}
                  >
                    {message.user}:
                  </div>
                  <div className="border border-blue-600 rounded p-4">
                    <StateHistoryTracker
                      onStateHistoryChange={onStateHistoryChange}
                      component={LLMComponent}
                    />
                  </div>
                </div>
              );
            } else {
              throw new Error("Unrecognized message type");
            }
          })}
      </div>
      <div className="flex w-full gap-3 border-t border-gray-500 p-8">
        <input
          placeholder="Say something..."
          ref={inputRef}
          className="p-3 w-full border border-gray-500"
          type="text"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
        />
        {loading ? (
          <div className="flex items-center justify-center p-3">
            <LoadingSpinner />
          </div>
        ) : (
          <button
            disabled={loading}
            onClick={handleSend}
            className="border border-gray-500 p-3 hover:cursor-pointer hover:text-blue-500 hover:border-blue-500"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
