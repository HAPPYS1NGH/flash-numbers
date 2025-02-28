import { NumberGame } from "./components/NumberGame";

export default function Home() {
  return (
    <div className="max-w-lg mx-auto px-4">
      <div className="text-center mb-6">
        <div className="inline-block bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700">
          Click numbers 1-9 in order • Beat the clock
        </div>
      </div>
      <NumberGame />
    </div>
  );
}
