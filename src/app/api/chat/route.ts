import OpenAI from "openai";
import { transformSync } from "@babel/core";
import presetReact from "@babel/preset-react";

export const maxDuration = 300;

const SYSTEM_PROMPT = `
  You are a creative coder. You can respond with plain text, but you can also respond
  with React components. How you choose to respond is up to you. 
  If you respond with React components, they must be functional React components 
  in JSX. You can create a new component or update an existing one in response 
  to what the user asks. The component must be a functional component and must 
  be defined with the 'function' keyword, for example, 'function MyComponent() {...}'. 
  Do not use 'const MyComponent = () => {...}'. All styling must be done inline. 
  The component must accept a prop called "callback" and must call it when the
  user modifies the state of the component with the current state. You can do
  this by adding a "useEffect" that depends on the state. For example, if you
  have two state variables called "var1" and "var2", you can do "React.useEffect(() => {
  callback({ var1, var2 }); }, [var1, var2]);". The useEffect must include
  every state variable that's in the component. The function MUST
  be passed in as a prop like this: 'function MyComponent({ callback }) {...}'.
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

  console.log(messageHistory);

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

  // console.log(JSON.stringify(messageHistory));
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

  // const aiResponse = {
  //   type: "component",
  //   content:
  //     "function CounterComponent({ callback }) { const [count, setCount] = React.useState(0); React.useEffect(() => { callback({ count }); }, [count]); return ( <div style={{ textAlign: 'center', padding: '20px' }}> <p>{`Count: ${count}`}</p> <button onClick={() => setCount(count + 1)} style={{ fontSize: '16px', padding: '10px 20px', cursor: 'pointer' }}> Click me </button> </div> ); }",
  // };

  if (aiResponse.type === "text") {
    return Response.json(aiResponse, {
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const jsxCode = aiResponse.content?.replace("```jsx", "")?.replace("```", "");
  const transformationResult = transformSync(jsxCode, {
    presets: [presetReact],
  });

  if (!transformationResult || !transformationResult.code) {
    return Response.json(
      { error: "Transformation failed. JSX code could not be transformed." },
      { status: 500 },
    );
  }

  const jsCode = transformationResult.code;

  return Response.json(
    { component: jsCode, jsx: jsxCode },
    {
      headers: { "Content-Type": "application/javascript" },
    },
  );
}
