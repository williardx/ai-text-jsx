"use client";

import React, { useState, useRef } from "react";

interface IComponent {
  (): JSX.Element;
}

export default function Chat() {
  const [dynamicComponents, setDynamicComponents] = useState<IComponent[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = async () => {
    const inputText = inputRef.current?.value;
    console.log("inputText", inputText);
    const res = await fetch("/api", {
      method: "POST",
      body: JSON.stringify({ inputText }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    const ComponentFunction = new Function("React", `return ${data.component}`)(
      React,
    );
    setDynamicComponents((prev) => [...prev, ComponentFunction]);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-3">
        <input ref={inputRef} className="p-3" type="text" />
        <button
          onClick={handleClick}
          className="border border-gray-500 p-3 hover:cursor-pointer"
        >
          Send
        </button>
      </div>
      <div className="flex flex-col gap-6">
        {dynamicComponents.length > 0 &&
          dynamicComponents.map((DynamicComponent, i) => {
            return <DynamicComponent key={i} />;
          })}
      </div>
    </div>
  );
}
