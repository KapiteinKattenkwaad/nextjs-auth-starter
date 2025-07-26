export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-6">Next.js Authentication Starter</h1>
      <p className="text-xl mb-4">A complete authentication solution for your Next.js projects</p>
      <div className="flex gap-4 mt-4">
        <a href="/auth/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          Login
        </a>
        <a href="/auth/register" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
          Register
        </a>
      </div>
    </main>
  );
}