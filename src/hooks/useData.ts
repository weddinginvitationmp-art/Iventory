import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import * as api from '../lib/api'
import type { Item, Transaction } from '../lib/mockData'

// ── Items hook ────────────────────────────────────────────────────────────────

export function useItems() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.fetchItems()
      setItems(data)
      setError(null)
    } catch (e: any) {
      setError(e.message)
      toast.error('Không thể tải dữ liệu kho hàng')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addItem = useCallback(async (data: Omit<Item, 'id' | 'createdAt'>) => {
    const item = await api.createItem(data)
    setItems(prev => [...prev, item])
    return item
  }, [])

  const editItem = useCallback(async (id: string, data: Partial<Item>) => {
    const updated = await api.updateItem(id, data)
    setItems(prev => prev.map(i => i.id === id ? updated : i))
    return updated
  }, [])

  const removeItem = useCallback(async (id: string) => {
    await api.deleteItem(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const removeItems = useCallback(async (ids: string[]) => {
    await Promise.all(ids.map(api.deleteItem))
    setItems(prev => prev.filter(i => !ids.includes(i.id)))
  }, [])

  return { items, loading, error, reload: load, addItem, editItem, removeItem, removeItems }
}

// ── Transactions hook ─────────────────────────────────────────────────────────

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.fetchTransactions()
      setTransactions(data)
      setError(null)
    } catch (e: any) {
      setError(e.message)
      toast.error('Không thể tải giao dịch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const tx = await api.createTransaction(data)
    setTransactions(prev => [tx, ...prev])
    return tx
  }, [])

  const removeTransaction = useCallback(async (id: string) => {
    await api.deleteTransaction(id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [])

  return { transactions, loading, error, reload: load, addTransaction, removeTransaction }
}
