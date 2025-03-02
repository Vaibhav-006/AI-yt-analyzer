import Chat from '../components/Chat';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4">
        <header className="py-6 text-center">
          <h1 className="text-3xl font-bold text-white">NexG</h1>
          <p className="text-gray-400 mt-2">Powered by Next Generation</p>
        </header>
        <Chat />
      </div>
    </main>
  );
}
