"use client";

import React, { useState, useRef } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface IComponent {
  (): JSX.Element;
}

interface Message {
  user: "you" | "bot";
  type: "text" | "component";
  content: string | IComponent;
}

export default function Chat() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleClick = async () => {
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { type: "text", content: inputRef.current?.value || "", user: "you" },
    ]);
    const inputText = inputRef.current?.value;
    console.log("inputText", inputText);
    const res = await fetch("/api", {
      method: "POST",
      body: JSON.stringify({ inputText }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    setLoading(false);
    const data = await res.json();
    const ComponentFunction = new Function("React", `return ${data.component}`)(
      React,
    );
    setMessages((prev) => [
      ...prev,
      { type: "component", content: ComponentFunction, user: "bot" },
    ]);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col gap-6">
        {messages.length > 0 &&
          messages.map((message, i) => {
            if (message.type === "text") {
              return (
                <div key={i}>
                  <span className="font-bold">{message.user}</span>:{" "}
                  {message.content as string}
                </div>
              );
            } else {
              const Component = message.content as IComponent;
              return (
                <div key={i}>
                  <span className="font-bold">{message.user}</span>:{" "}
                  <Component />
                </div>
              );
            }
          })}
      </div>
      <div className="flex gap-3">
        <input ref={inputRef} className="p-3" type="text" />
        <button
          disabled={loading}
          onClick={handleClick}
          className="border border-gray-500 p-3 hover:cursor-pointer"
        >
          {loading ? <LoadingSpinner /> : "Send"}
        </button>
      </div>
    </div>
  );
}
