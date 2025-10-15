'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  SparklesIcon, 
  PhotoIcon, 
  PaintBrushIcon,
  BeakerIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't auto-redirect, show landing page
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading DeepGen...</div>
      </div>
    )
  }

  // If user is logged in, they can still see landing page with different CTA
  const features = [
    {
      name: 'Text to Design',
      description: 'Transform your ideas into stunning visuals with AI-powered text-to-image generation',
      icon: SparklesIcon,
      color: 'from-blue-500 to-purple-600'
    },
    {
      name: 'Photo Restoration',
      description: 'Bring old and damaged photos back to life with intelligent restoration algorithms',
      icon: PhotoIcon,
      color: 'from-green-500 to-teal-600'
    },
    {
      name: 'Image Enhancement',
      description: 'Upscale and enhance your images with super-resolution and style transfer',
      icon: PaintBrushIcon,
      color: 'from-purple-500 to-pink-600'
    },
    {
      name: 'GAN Playground',
      description: 'Experiment with generative models and train your own custom AI generators',
      icon: BeakerIcon,
      color: 'from-orange-500 to-red-600'
    }
  ]

  const teamMembers = [
    'Kamal Sai A',
    'Anvitha S', 
    'Ankitha V',
    'M Shamitha'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-white font-bold text-xl">DeepGen</div>
          <div>
            {user ? (
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/auth"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="w-48 h-48 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-6 mx-auto">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center relative overflow-hidden">
              <SparklesIcon className="w-16 h-16 text-white" />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
            </div>
          </div>
          <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            DeepGen
          </h1>
        </div>

        <h2 className="text-2xl md:text-3xl font-semibold text-gray-300 mb-8 max-w-3xl">
          A GAN-Based Framework for Image Generation
        </h2>

        {/* Team Credits */}
        <div className="mb-12">
          <p className="text-gray-400 mb-4 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 mr-2" />
            Developed by
            <SparklesIcon className="w-5 h-5 ml-2" />
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-gray-300 font-medium">
            {teamMembers.map((member, index) => (
              <span key={index} className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                {member}
              </span>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="mb-16">
          <Link
            href={user ? "/dashboard" : "/auth"}
            className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center"
          >
            Explore DeepGen
            <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-6 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-bold text-white text-center mb-16">
            Powerful AI Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 border border-white/10">
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-3">{feature.name}</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2024 DeepGen. A GAN-Based Framework for Next-Generation Image Creation.
          </p>
        </div>
      </footer>
    </div>
  )
}
