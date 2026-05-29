'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function Analytics() {
  const [items, setItems] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase.from('inventory').select('*')
      setItems(data || [])
    }
    fetchItems()
  }, [])

  const categoryData = Object.entries(
    items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const expiryData = [
    { name: 'Expired', value: items.filter(i => i.expiry_date && new Date(i.expiry_date) < new Date()).length },
    { name: '1-3 days', value: items.filter(i => {
      if (!i.expiry_date) return false
      const days = Math.ceil((new Date(i.expiry_date).getTime() - new Date().getTime()) / 86400000)
      return days >= 0 && days <= 3
    }).length },
    { name: '4-7 days', value: items.filter(i => {
      if (!i.expiry_date) return false
      const days = Math.ceil((new Date(i.expiry_date).getTime() - new Date().getTime()) / 86400000)
      return days > 3 && days <= 7
    }).length },
    { name: '7+ days', value: items.filter(i => {
      if (!i.expiry_date) return false
      const days = Math.ceil((new Date(i.expiry_date).getTime() - new Date().getTime()) / 86400000)
      return days > 7
    }).length },
  ]

  const lowStockItems = items.filter(i => i.quantity <= i.min_stock_level)

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7']

  return (
    <main className="min-h-screen bg-gray-950 p-6">
      <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white mb-4 block">← Back</button>
      <h1 className="text-2xl font-bold text-white mb-6">📊 Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 p-6 rounded-xl">
          <p className="text-gray-400">Total Items</p>
          <p className="text-3xl font-bold text-white">{items.length}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl">
          <p className="text-gray-400">Expiring Soon</p>
          <p className="text-3xl font-bold text-yellow-400">
            {items.filter(i => {
              if (!i.expiry_date) return false
              const days = Math.ceil((new Date(i.expiry_date).getTime() - new Date().getTime()) / 86400000)
              return days >= 0 && days <= 7
            }).length}
          </p>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl">
          <p className="text-gray-400">Low Stock</p>
          <p className="text-3xl font-bold text-red-400">{lowStockItems.length}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl">
          <p className="text-gray-400">Categories</p>
          <p className="text-3xl font-bold text-blue-400">{categoryData.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-white font-bold mb-4">Items by Category</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
              <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-white font-bold mb-4">Expiry Timeline</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={expiryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {expiryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-gray-900 p-6 rounded-xl">
          <h2 className="text-white font-bold mb-4">⚠️ Low Stock Alert</h2>
          <div className="space-y-2">
            {lowStockItems.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-gray-800 px-4 py-3 rounded-lg">
                <span className="text-white">{item.name}</span>
                <span className="text-red-400">{item.quantity} {item.unit} (min: {item.min_stock_level})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}