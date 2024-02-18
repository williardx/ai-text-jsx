import Image from "next/image";
import Chat from "./Chat";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Chat />
    </main>
  );
}
