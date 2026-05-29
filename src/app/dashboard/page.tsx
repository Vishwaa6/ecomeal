'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ total: 0, expiring: 0, lowStock: 0 })
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profile)

      const { data: items } = await supabase.from('inventory').select('*')
      if (items) {
        const expiring = items.filter(i => {
          if (!i.expiry_date) return false
          const days = Math.ceil((new Date(i.expiry_date).getTime() - new Date().getTime()) / 86400000)
          return days >= 0 && days <= 7
        }).length
        const lowStock = items.filter(i => i.quantity <= i.min_stock_level).length
        setStats({ total: items.length, expiring, lowStock })
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 px-6 py-4 flex justify-between items-center">
        <h1 className="text-white font-bold text-xl">🍽️ Ecomeal</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">{profile?.full_name} • {profile?.role}</span>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300">Logout</button>
        </div>
      </nav>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Welcome back, {profile?.full_name}! 👋</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 p-6 rounded-xl">
            <p className="text-gray-400">Total Items</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl">
            <p className="text-gray-400">Expiring Soon</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.expiring}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl">
            <p className="text-gray-400">Low Stock</p>
            <p className="text-3xl font-bold text-red-400">{stats.lowStock}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/dashboard/inventory" className="bg-gray-900 p-6 rounded-xl hover:bg-gray-800 cursor-pointer">
            <p className="text-2xl mb-2">📦</p>
            <p className="text-white font-bold">Inventory</p>
            <p className="text-gray-400 text-sm">Manage stock & expiry</p>
          </a>
          <a href="/dashboard/ai" className="bg-gray-900 p-6 rounded-xl hover:bg-gray-800 cursor-pointer">
            <p className="text-2xl mb-2">🤖</p>
            <p className="text-white font-bold">AI Chef Specials</p>
            <p className="text-gray-400 text-sm">Generate dish recommendations</p>
          </a>
          <a href="/dashboard/analytics" className="bg-gray-900 p-6 rounded-xl hover:bg-gray-800 cursor-pointer">
            <p className="text-2xl mb-2">📊</p>
            <p className="text-white font-bold">Analytics</p>
            <p className="text-gray-400 text-sm">Trends & insights</p>
          </a>
        </div>
      </div>
    </main>
  )
}