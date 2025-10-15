'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  SparklesIcon, 
  PhotoIcon, 
  PaintBrushIcon,
  BeakerIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Stats {
  totalGenerations: number
  totalRestores: number
  totalEnhancements: number
  totalCustomModels: number
  averageQuality: number
  recentActivity: any[]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalGenerations: 0,
    totalRestores: 0,
    totalEnhancements: 0,
    totalCustomModels: 0,
    averageQuality: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      try {
        // Get counts and quality scores
        const [generationsResult, restoresResult, enhancementsResult, modelsResult] = 
          await Promise.all([
            supabase.from('generations').select('attention_score', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('restores').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('enhancements').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('custom_models').select('id', { count: 'exact' }).eq('user_id', user.id)
          ])

        // Calculate average quality
        const qualityScores = generationsResult.data
          ?.map(g => g.attention_score)
          .filter(score => score !== null) || []
        
        const avgQuality = qualityScores.length > 0 
          ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
          : 0

        // Get recent activity
        const recentResults = await Promise.all([
          supabase
            .from('generations')
            .select('id, input_prompt, created_at, output_image_url')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('restores')
            .select('id, created_at, restored_image_url')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(2),
          supabase
            .from('enhancements')
            .select('id, enhancement_type, created_at, enhanced_image_url')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(2)
        ])

        const recentActivity = [
          ...(recentResults[0].data || []).map(item => ({
            ...item,
            type: 'generation',
            image: item.output_image_url,
            description: item.input_prompt
          })),
          ...(recentResults[1].data || []).map(item => ({
            ...item,
            type: 'restore',
            image: item.restored_image_url,
            description: 'Photo restoration'
          })),
          ...(recentResults[2].data || []).map(item => ({
            ...item,
            type: 'enhancement',
            image: item.enhanced_image_url,
            description: `Image ${item.enhancement_type}`
          }))
        ]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)

        setStats({
          totalGenerations: generationsResult.count || 0,
          totalRestores: restoresResult.count || 0,
          totalEnhancements: enhancementsResult.count || 0,
          totalCustomModels: modelsResult.count || 0,
          averageQuality: avgQuality,
          recentActivity
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Generations',
      value: stats.totalGenerations,
      description: 'Images created with AI',
      color: 'bg-blue-500',
      icon: SparklesIcon
    },
    {
      name: 'Photo Restores',
      value: stats.totalRestores,
      description: 'Images restored',
      color: 'bg-green-500',
      icon: PhotoIcon
    },
    {
      name: 'Enhancements',
      value: stats.totalEnhancements,
      description: 'Images enhanced',
      color: 'bg-purple-500',
      icon: PaintBrushIcon
    },
    {
      name: 'Custom Models',
      value: stats.totalCustomModels,
      description: 'Models trained',
      color: 'bg-orange-500',
      icon: BeakerIcon
    }
  ]

  const quickActions = [
    {
      name: 'Create with AI',
      description: 'Generate images from text prompts',
      href: '/text-to-design',
      icon: SparklesIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Restore Photos',
      description: 'Fix damaged or old photos',
      href: '/photo-restore',
      icon: PhotoIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Enhance Images',
      description: 'Upscale and improve image quality',
      href: '/enhance-image',
      icon: PaintBrushIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'GAN Playground',
      description: 'Experiment with generative models',
      href: '/gan-playground',
      icon: BeakerIcon,
      color: 'bg-orange-500'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'generation': return SparklesIcon
      case 'restore': return PhotoIcon
      case 'enhancement': return PaintBrushIcon
      default: return ClockIcon
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.email?.split('@')[0]}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your DeepGen projects
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 ${stat.color} rounded-md flex items-center justify-center`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </dd>
                    <dd className="text-sm text-gray-500">
                      {stat.description}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 ${action.color} rounded-md flex items-center justify-center mr-4`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{action.name}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              {stats.averageQuality > 0 && (
                <div className="flex items-center text-sm text-gray-500">
                  <StarIcon className="h-4 w-4 mr-1" />
                  Avg Quality: {Math.round(stats.averageQuality * 10)/10}/10
                </div>
              )}
            </div>

            {stats.recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400">Start creating to see your activity here!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id || index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <img
                          src={activity.image}
                          alt="Activity"
                          className="w-10 h-10 object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <IconComponent className="h-4 w-4 mr-1 text-gray-400" />
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {activity.type}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {activity.description}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {stats.recentActivity.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/history"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  View all history →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
