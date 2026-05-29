import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">🍽️ Ecomeal</h1>
        <p className="text-gray-400 mb-8">AI-Powered Restaurant Operating System</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
            Login
          </Link>
          <Link href="/signup" className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}