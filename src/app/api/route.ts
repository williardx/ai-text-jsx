import OpenAI from "openai";
import { transformSync } from "@babel/core";
import presetReact from "@babel/preset-react";

const SYSTEM_PROMPT = `
  You are a creative coder. You can respond with plain text, but you can also respond
  with React components. How you choose to respond is up to you. 
  If you respond with React components, they must be functional React components 
  in JSX. You can create a new component or update an existing one in response 
  to what the user asks. The component must be a functional component and must 
  be defined with the 'function' keyword, for example, 'function MyComponent() {...}'. 
  Do not use 'const MyComponent = () => {...}'. All styling must be done inline. 
  You can use any hooks that you want but must namespace it with React, for example, 
  'React.useState' instead of 'useState'. You have liberty to be extremely creative 
  and to add in interactivity in your components. Do NOT include any formatting 
  strings like \`\`\`jsx or \`\`\`javascript. Only include the JSX code.
  Feel free to use emojis, make shapes and patterns or even create a game.

  Remember that you can choose to respond with plain text or with a React component.
  Respond with a JSON object, where the 'type' field is 'text' or 'component' and
  the 'content' field is the text or the component.
`;

export async function POST(req: Request): Promise<Response> {
  const { inputText: prompt, messageHistory } = await req.json();
  console.log("messageHistory", messageHistory);
  console.log("prompt", prompt);
  const openai = new OpenAI();
  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...(messageHistory || []),
    {
      role: "user",
      content: prompt,
    },
  ];
  const completion = await openai.chat.completions.create({
    messages,
    model: "gpt-4-0125-preview",
    response_format: { type: "json_object" },
    temperature: 1,
  });

  if (
    !completion.choices ||
    !completion.choices.length ||
    !completion.choices[0].message.content
  ) {
    return Response.json(
      { error: "No response from the AI model." },
      { status: 500 },
    );
  }

  const aiResponse = JSON.parse(completion.choices[0].message.content);
  if (aiResponse.type === "text") {
    return Response.json(aiResponse, {
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const jsxCode = aiResponse.content?.replace("```jsx", "")?.replace("```", "");

  if (!transformSync) {
    return Response.json(
      {
        error:
          "Babel is not available in the current environment. Please try again later.",
      },
      { status: 500 },
    );
  }

  const jsCode = transformSync(jsxCode, {
    presets: [presetReact],
  }).code;

  return Response.json(
    { component: jsCode, jsx: jsxCode },
    {
      headers: { "Content-Type": "application/javascript" },
    },
  );
}
