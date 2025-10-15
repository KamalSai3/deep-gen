'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { PhotoIcon, ClockIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface HistoryItem {
  id: string
  type: 'generation' | 'restore' | 'enhancement'
  originalUrl?: string
  resultUrl: string
  createdAt: string
  metadata?: any
}

export default function HistoryPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'generation' | 'restore' | 'enhancement'>('all')

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Fetch all user's history
        const [generationsResult, restoresResult, enhancementsResult] = await Promise.all([
          supabase
            .from('generations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('restores')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('enhancements')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        ])

        const allItems: HistoryItem[] = [
          ...(generationsResult.data || []).map(item => ({
            id: item.id,
            type: 'generation' as const,
            resultUrl: item.output_image_url,
            createdAt: item.created_at,
            metadata: {
              prompt: item.input_prompt,
              model: item.model_type,
              attentionScore: item.attention_score
            }
          })),
          ...(restoresResult.data || []).map(item => ({
            id: item.id,
            type: 'restore' as const,
            originalUrl: item.original_image_url,
            resultUrl: item.restored_image_url,
            createdAt: item.created_at,
            metadata: {
              strength: item.restoration_strength
            }
          })),
          ...(enhancementsResult.data || []).map(item => ({
            id: item.id,
            type: 'enhancement' as const,
            originalUrl: item.original_image_url,
            resultUrl: item.enhanced_image_url,
            createdAt: item.created_at,
            metadata: {
              enhancementType: item.enhancement_type,
              style: item.style_applied,
              upscale: item.upscale_factor
            }
          }))
        ]

        // Sort by date
        allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setItems(allItems)
      } catch (error) {
        console.error('Error fetching history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [user])

  const filteredItems = filter === 'all' ? items : items.filter(item => item.type === filter)

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'generation': return 'Generated'
      case 'restore': return 'Restored'
      case 'enhancement': return 'Enhanced'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'generation': return 'bg-blue-100 text-blue-800'
      case 'restore': return 'bg-green-100 text-green-800'
      case 'enhancement': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="aspect-square bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">History</h1>
        <p className="text-gray-600">
          View all your generated, restored, and enhanced images
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex items-center space-x-4">
        <FunnelIcon className="h-5 w-5 text-gray-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">All Items ({items.length})</option>
          <option value="generation">Generated ({items.filter(i => i.type === 'generation').length})</option>
          <option value="restore">Restored ({items.filter(i => i.type === 'restore').length})</option>
          <option value="enhancement">Enhanced ({items.filter(i => i.type === 'enhancement').length})</option>
        </select>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No images yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'Start by generating, restoring, or enhancing some images!' 
              : `No ${filter} images found. Try a different filter.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-square bg-gray-100">
                <img
                  src={item.resultUrl}
                  alt={`${getTypeLabel(item.type)} image`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                    {getTypeLabel(item.type)}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                {/* Metadata */}
                <div className="text-xs text-gray-600">
                  {item.type === 'generation' && item.metadata?.prompt && (
                    <p className="truncate" title={item.metadata.prompt}>
                      "{item.metadata.prompt}"
                    </p>
                  )}
                  {item.type === 'restore' && (
                    <p>Strength: {Math.round((item.metadata?.strength || 0) * 100)}%</p>
                  )}
                  {item.type === 'enhancement' && (
                    <p>{item.metadata?.enhancementType?.replace('-', ' ')}</p>
                  )}
                </div>

                {/* Attention Score */}
                {item.metadata?.attentionScore && (
                  <div className="mt-2 text-xs">
                    <span className="text-gray-500">Quality: </span>
                    <span className="font-medium text-blue-600">
                      {Math.round(item.metadata.attentionScore * 10)/10}/10
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
