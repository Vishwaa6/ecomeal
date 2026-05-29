'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase, saveToCache, getFromCache, addToQueue, syncQueue } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type InventoryItem = {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  expiry_date: string
  supplier: string
  min_stock_level: number
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [form, setForm] = useState({
    name: '', category: 'vegetables', quantity: 0,
    unit: 'kg', expiry_date: '', supplier: '', min_stock_level: 10
  })
  const router = useRouter()

  const fetchItems = async () => {
    if (!navigator.onLine) {
      setItems(getFromCache())
      setLoading(false)
      return
    }
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false })
    const result = data || []
    setItems(result)
    saveToCache(result)
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()

    const handleOnline = () => {
      setIsOnline(true)
      syncQueue().then(() => fetchItems())
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    // Real-time updates via polling
    const interval = setInterval(() => {
      if (navigator.onLine) fetchItems()
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const handleAdd = async () => {
    if (!form.name) return
    if (!navigator.onLine) {
      const tempItem = { ...form, id: `offline_${Date.now()}` }
      addToQueue({ type: 'INSERT', data: form })
      setItems(prev => {
        const updated = [tempItem as any, ...prev]
        saveToCache(updated)
        return updated
      })
      setForm({ name: '', category: 'vegetables', quantity: 0, unit: 'kg', expiry_date: '', supplier: '', min_stock_level: 10 })
      setShowForm(false)
      return
    }
    await supabase.from('inventory').insert(form)
    setForm({ name: '', category: 'vegetables', quantity: 0, unit: 'kg', expiry_date: '', supplier: '', min_stock_level: 10 })
    setShowForm(false)
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    if (!navigator.onLine) {
      addToQueue({ type: 'DELETE', data: { id } })
      setItems(prev => {
        const updated = prev.filter(i => i.id !== id)
        saveToCache(updated)
        return updated
      })
      return
    }
    await supabase.from('inventory').delete().eq('id', id)
    fetchItems()
  }

  const getExpiryStatus = (expiry: string) => {
    if (!expiry) return null
    const days = Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (days < 0) return { label: 'Expired', color: 'text-red-500' }
    if (days <= 3) return { label: `${days}d left`, color: 'text-red-400' }
    if (days <= 7) return { label: `${days}d left`, color: 'text-yellow-400' }
    return { label: `${days}d left`, color: 'text-green-400' }
  }

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'all' || item.category === category
    return matchSearch && matchCategory
  })

  return (
    <main className="min-h-screen bg-gray-950 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white mb-2 block">← Back</button>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-sm px-3 py-1 rounded-full ${isOnline ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>
          <button onClick={() => setShowForm(!showForm)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            + Add Item
          </button>
        </div>
      </div>

      {!isOnline && (
        <div className="bg-yellow-900 text-yellow-300 px-4 py-3 rounded-lg mb-6">
          ⚠️ You are offline. Changes will sync when connection is restored.
        </div>
      )}

      {showForm && (
        <div className="bg-gray-900 p-6 rounded-xl mb-6 grid grid-cols-2 gap-4">
          <input placeholder="Item name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg" />
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg">
            <option value="vegetables">Vegetables</option>
            <option value="fruits">Fruits</option>
            <option value="dairy">Dairy</option>
            <option value="meat">Meat</option>
            <option value="grains">Grains</option>
            <option value="spices">Spices</option>
          </select>
          <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg" />
          <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg">
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="l">L</option>
            <option value="ml">ml</option>
            <option value="pcs">pcs</option>
          </select>
          <input type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg" />
          <input placeholder="Supplier" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg" />
          <input type="number" placeholder="Min stock level" value={form.min_stock_level} onChange={e => setForm({...form, min_stock_level: Number(e.target.value)})}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg" />
          <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Save Item
          </button>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg flex-1" />
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg">
          <option value="all">All Categories</option>
          <option value="vegetables">Vegetables</option>
          <option value="fruits">Fruits</option>
          <option value="dairy">Dairy</option>
          <option value="meat">Meat</option>
          <option value="grains">Grains</option>
          <option value="spices">Spices</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 px-4 py-3">Name</th>
                <th className="text-left text-gray-400 px-4 py-3">Category</th>
                <th className="text-left text-gray-400 px-4 py-3">Quantity</th>
                <th className="text-left text-gray-400 px-4 py-3">Expiry</th>
                <th className="text-left text-gray-400 px-4 py-3">Supplier</th>
                <th className="text-left text-gray-400 px-4 py-3">Status</th>
                <th className="text-left text-gray-400 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const expiry = getExpiryStatus(item.expiry_date)
                const isLowStock = item.quantity <= item.min_stock_level
                return (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800">
                    <td className="text-white px-4 py-3">{item.name}</td>
                    <td className="text-gray-400 px-4 py-3 capitalize">{item.category}</td>
                    <td className={`px-4 py-3 ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                      {item.quantity} {item.unit}
                    </td>
                    <td className={`px-4 py-3 ${expiry?.color || 'text-gray-400'}`}>
                      {expiry?.label || 'No expiry'}
                    </td>
                    <td className="text-gray-400 px-4 py-3">{item.supplier || '-'}</td>
                    <td className="px-4 py-3">
                      {isLowStock && <span className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs">Low Stock</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 text-sm">
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-8">No items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}