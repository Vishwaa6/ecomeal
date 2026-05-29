'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AIChefSpecials() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .order('expiry_date', { ascending: true })
      setItems(data || [])
    }
    fetchItems()
  }, [])

  const generateSpecials = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const expiringItems = items
        .filter(i => i.expiry_date)
        .slice(0, 6)
        .map(i => `${i.name} (${i.quantity}${i.unit}, expires ${i.expiry_date})`)
        .join(', ')

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: expiringItems })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 p-6">
      <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white mb-4 block">← Back</button>
      <h1 className="text-2xl font-bold text-white mb-2">🤖 AI Chef Specials</h1>
      <p className="text-gray-400 mb-6">Generate dish recommendations based on expiring ingredients</p>

      <div className="bg-gray-900 p-6 rounded-xl mb-6">
        <h2 className="text-white font-bold mb-4">Expiring Ingredients</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {items.filter(i => i.expiry_date).slice(0, 6).map(item => (
            <span key={item.id} className="bg-gray-800 text-yellow-400 px-3 py-1 rounded-full text-sm">
              {item.name} — {item.quantity}{item.unit}
            </span>
          ))}
        </div>
        <button
          onClick={generateSpecials}
          disabled={loading || items.length === 0}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '🤖 Generating...' : '✨ Generate Chef Specials'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900 text-red-300 p-4 rounded-xl mb-6">
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.dishes?.map((dish: any, i: number) => (
            <div key={i} className="bg-gray-900 p-6 rounded-xl">
              <h3 className="text-white font-bold text-lg mb-2">🍽️ {dish.name}</h3>
              <p className="text-gray-400 mb-3">{dish.description}</p>
              <div className="mb-3">
                <p className="text-green-400 text-sm font-bold mb-1">Ingredients used:</p>
                <div className="flex flex-wrap gap-2">
                  {dish.ingredients?.map((ing: string, j: number) => (
                    <span key={j} className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-sm">{ing}</span>
                  ))}
                </div>
              </div>
              <p className="text-yellow-400 text-sm">♻️ {dish.waste_tip}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}