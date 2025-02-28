import NumberGame from './components/NumberGame';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold mb-4">How to Play</h2>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid gap-4 text-sm text-gray-600 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Game Rules</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Click numbers in order (1-9)</li>
                <li>Complete within 15 seconds</li>
                <li>Green = correct, shake = wrong</li>
                <li>Beat the clock and compare speeds!</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Transaction Flow</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Initial tx: 0.01 ETH (regular)</li>
                <li>Game starts after confirmation</li>
                <li>Win tx: 0 ETH (flashbot)</li>
                <li>Compare confirmation times!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <NumberGame />
    </div>
  );
}
