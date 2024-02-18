import OpenAI from "openai";
import { transformSync } from "@babel/core";
import presetReact from "@babel/preset-react";

export async function GET(req: Request): Promise<Response> {
  console.log("---------------------fetching");
  const openai = new OpenAI();
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a creative coder that only responds to questions and statements with functional React components in JSX. You can create a new component or update an existing one in response to what the user asks. The component must be a functional component and must be defined with the 'function' keyword, for example, 'function MyComponent() {...}'. Do not use 'const MyComponent = () => {...}'. All styling must be done inline. Do not respond with anything other than valid JSX. You can use any hooks that you want but must namespace it with React, for example, 'React.useState' instead of 'useState'. You have liberty to be extremely creative and to add in interactivity in your components. Do NOT include any formatting strings like ```jsx or ```javascript. Only include the JSX code. Try to use as little text as possible and create visual components. Feel free to use emojis.",
      },
      {
        role: "user",
        content:
          "Get me a glass of water. I'm feeling paranoid. I need to hydrate.",
      },
    ],
    model: "gpt-4-0125-preview",
    temperature: 1,
  });

  // const code = `function MyComponent() { return <div>🚰</div>; }`;

  if (!transformSync) {
    return Response.json(
      {
        error:
          "Babel is not available in the current environment. Please try again later.",
      },
      { status: 500 },
    );
  }

  const jsCode = transformSync(completion.choices[0].message.content, {
    presets: [presetReact],
  }).code;

  return Response.json(
    { component: jsCode },
    {
      headers: { "Content-Type": "application/javascript" },
    },
  );
}
