'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  BeakerIcon, 
  ArrowPathIcon,
  PhotoIcon,
  PlusIcon,
  CubeIcon
} from '@heroicons/react/24/outline'

// Mock demo generators
const DEMO_GENERATORS = [
  {
    id: 'fashion-mnist',
    name: 'Fashion-MNIST Generator',
    description: 'Generate fashion items (shirts, shoes, bags, etc.)',
    category: 'Fashion',
    samples: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=128&h=128&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=128&h=128&fit=crop',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=128&h=128&fit=crop',
    ]
  },
  {
    id: 'cifar-10',
    name: 'CIFAR-10 Generator',
    description: 'Generate objects (cars, animals, planes, etc.)',
    category: 'Objects',
    samples: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=128&h=128&fit=crop',
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=128&h=128&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=128&h=128&fit=crop',
    ]
  }
]

interface CustomModel {
  id: string
  model_name: string
  dataset_name: string
  training_status: string
  sample_images_url: string[]
  created_at: string
}

interface GenerationResult {
  id: string
  imageUrl: string
  attentionScore: number
  seed: number
  model: string
}

export default function GanPlaygroundPage() {
  const { user } = useAuth()
  const [customModels, setCustomModels] = useState<CustomModel[]>([])
  const [selectedGenerator, setSelectedGenerator] = useState<string>('')
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000000))
  const [latentSize, setLatentSize] = useState(100)
  const [creativity, setCreativity] = useState(0.5)
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<GenerationResult[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch custom models
  useEffect(() => {
    const fetchCustomModels = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('custom_models')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setCustomModels(data || [])
      } catch (error) {
        console.error('Error fetching custom models:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomModels()
  }, [user])

  const generateWithDemo = async (generatorId: string) => {
    setGenerating(true)
    setMessage('Generating with demo model...')

    try {
      // Simulate generation time
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))

      const generator = DEMO_GENERATORS.find(g => g.id === generatorId)
      if (!generator) throw new Error('Generator not found')

      // Pick a random sample image
      const imageUrl = generator.samples[Math.floor(Math.random() * generator.samples.length)]
      const attentionScore = 5 + Math.random() * 4 // 5-9 range for demo

      // Save to database
      const { data: generation, error } = await supabase
        .from('generations')
        .insert({
          user_id: user!.id,
          model_type: `gan-${generatorId}`,
          input_prompt: `Generated with ${generator.name}`,
          output_image_url: imageUrl,
          attention_score: attentionScore,
          seed_value: seed,
          creativity_level: creativity,
        })
        .select()
        .single()

      if (error) throw error

      const result: GenerationResult = {
        id: generation.id,
        imageUrl: imageUrl,
        attentionScore: attentionScore,
        seed: seed,
        model: generator.name
      }

      setResults([result, ...results])
      setMessage('Generation complete!')
      
      // Randomize seed for next generation
      setSeed(Math.floor(Math.random() * 1000000))
    } catch (error: any) {
      setMessage(error.message || 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const registerNewModel = async () => {
    if (!user) return

    try {
      // Mock registration - in reality this would connect to Colab
      const { error } = await supabase
        .from('custom_models')
        .insert({
          user_id: user.id,
          model_name: `Custom Model ${customModels.length + 1}`,
          dataset_name: 'User Dataset',
          training_status: 'pending',
          sample_images_url: [],
        })

      if (error) throw error

      setMessage('Model registration started! Train your model in Colab.')
      
      // Refresh models list
      const { data } = await supabase
        .from('custom_models')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      setCustomModels(data || [])
    } catch (error: any) {
      setMessage(error.message || 'Failed to register model.')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">GAN Playground</h1>
        <p className="text-gray-600">
          Experiment with generative models and train your own
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generators Section */}
        <div className="space-y-6">
          {/* Demo Generators */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Demo Generators</h2>
            <div className="space-y-4">
              {DEMO_GENERATORS.map((generator) => (
                <div key={generator.id} className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{generator.name}</h3>
                      <p className="text-sm text-gray-500">{generator.description}</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {generator.category}
                    </span>
                  </div>
                  
                  {/* Sample images */}
                  <div className="flex space-x-2 mb-3">
                    {generator.samples.map((sample, index) => (
                      <img
                        key={index}
                        src={sample}
                        alt={`${generator.name} sample`}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => generateWithDemo(generator.id)}
                    disabled={generating}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {generating ? (
                      <>
                        <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <BeakerIcon className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Models */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Your Custom Models</h2>
              <button
                onClick={registerNewModel}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Register Model
              </button>
            </div>

            {customModels.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No custom models yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Register a model to start training your own GAN
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customModels.map((model) => (
                  <div key={model.id} className="bg-white rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{model.model_name}</h3>
                        <p className="text-sm text-gray-500">Dataset: {model.dataset_name}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        model.training_status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : model.training_status === 'training'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {model.training_status}
                      </span>
                    </div>
                    {model.training_status === 'completed' && (
                      <button className="mt-3 w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700">
                        Generate with Model
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generation Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Generation Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seed Value
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                    disabled={generating}
                  />
                  <button
                    onClick={() => setSeed(Math.floor(Math.random() * 1000000))}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                    disabled={generating}
                  >
                    Random
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Creativity: {Math.round(creativity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={creativity}
                  onChange={(e) => setCreativity(parseFloat(e.target.value))}
                  className="w-full"
                  disabled={generating}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Generated Images</h2>
          
          {results.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No generations yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try one of the demo generators to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={result.imageUrl}
                      alt={`Generated by ${result.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{result.model}</span>
                      <span className="text-gray-500">Quality: {Math.round(result.attentionScore * 10)/10}/10</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Seed: {result.seed}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.includes('failed') || message.includes('Failed')
                ? 'bg-red-50 text-red-700' 
                : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
