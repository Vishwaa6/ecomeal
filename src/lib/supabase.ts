import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Offline queue - stores actions when offline
const QUEUE_KEY = 'ecomeal_offline_queue'
const INVENTORY_KEY = 'ecomeal_inventory_cache'

export const saveToCache = (items: any[]) => {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items))
}

export const getFromCache = (): any[] => {
  try {
    const data = localStorage.getItem(INVENTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const addToQueue = (action: { type: string, data: any }) => {
  try {
    const queue = getQueue()
    queue.push({ ...action, timestamp: new Date().toISOString() })
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {}
}

export const getQueue = (): any[] => {
  try {
    const data = localStorage.getItem(QUEUE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const clearQueue = () => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify([]))
}

export const syncQueue = async () => {
  const queue = getQueue()
  if (queue.length === 0) return

  for (const action of queue) {
    try {
      if (action.type === 'INSERT') {
        await supabase.from('inventory').insert(action.data)
      } else if (action.type === 'DELETE') {
        await supabase.from('inventory').delete().eq('id', action.data.id)
      }
    } catch {}
  }
  clearQueue()
}