"use client";

import React, { useState, useRef } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ReactComponent {
  (): JSX.Element;
}

interface Message {
  user: "user" | "assistant";
  type: "text" | "component";
  content: string | ReactComponent;
  jsx?: string;
}

export default function Chat() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSend = async () => {
    const inputText = inputRef.current?.value;
    if (!inputText) return;
    inputRef.current.value = "";
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { type: "text", content: inputText || "", user: "user" },
    ]);
    const res = await fetch("/api", {
      method: "POST",
      body: JSON.stringify({
        inputText,
        messageHistory: messages.map((m) => ({
          content: m.type === "text" ? m.content : m.jsx,
          role: m.user,
        })),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    setLoading(false);
    const data = await res.json();

    if (data.type === "text") {
      setMessages((prev) => [
        ...prev,
        { type: "text", content: data.content, user: "assistant" },
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

  return (
    <div className="flex flex-col items-center gap-6 border-4 border-gray-500 max-w-screen-sm w-full h-[700px] rounded justify-between">
      <div className="flex self-start flex-col gap-6 overflow-y-scroll w-full text-lg p-8 pb-0">
        {messages.length > 0 &&
          messages.map((message, i) => {
            if (message.type === "text") {
              return (
                <div key={i}>
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
            } else {
              const Component = message.content as ReactComponent;
              return (
                <div className="flex flex-col gap-2" key={i}>
                  <div
                    className={`font-bold ${
                      message.user === "assistant" ? "text-blue-600" : ""
                    }`}
                  >
                    {message.user}:
                  </div>
                  <div className="border border-blue-600 rounded p-4">
                    <Component />
                  </div>
                </div>
              );
            }
          })}
      </div>
      <div className="flex w-full gap-3 border-t border-gray-500 p-8">
        <input
          placeholder="Say something..."
          ref={inputRef}
          className="p-3 w-full"
          type="text"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
        />
        <button
          disabled={loading}
          onClick={handleSend}
          className="border border-gray-500 p-3 hover:cursor-pointer"
        >
          {loading ? <LoadingSpinner /> : "Send"}
        </button>
      </div>
    </div>
  );
}
