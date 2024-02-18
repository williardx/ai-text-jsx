"use client";

import React, { useEffect, useState } from "react";

interface IComponent {
  (): JSX.Element;
}

export default function Chat() {
  const [DynamicComponent, setDynamicComponent] = useState<IComponent | null>(
    null,
  );
  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api");
      const data = await res.json();
      const ComponentFunction = new Function(
        "React",
        `return ${data.component}`,
      )(React);
      setDynamicComponent(() => ComponentFunction);
    }
    fetchData();
  }, []);

  return <div>{DynamicComponent && <DynamicComponent />}</div>;
}
