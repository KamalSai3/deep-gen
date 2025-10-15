'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  SparklesIcon, 
  ArrowPathIcon,
  PhotoIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

interface GenerationResult {
  id: string
  imageUrl: string
  attentionScore: number
  seed: number
  prompt: string
}

export default function TextToDesignPage() {
  const { user } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [batchPrompts, setBatchPrompts] = useState('')
  const [creativity, setCreativity] = useState(0.5)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000000))
  const [batchMode, setBatchMode] = useState(false)
  const [batchCount, setBatchCount] = useState(2)
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<GenerationResult[]>([])
  const [message, setMessage] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const generateImages = async () => {
    if ((!prompt.trim() && !batchPrompts.trim()) || !user) return

    setGenerating(true)
    setMessage('Generating your images...')
    setResults([])

    try {
      if (batchMode && batchPrompts.trim()) {
        // Process batch prompts
        const prompts = batchPrompts.split('\n').filter(p => p.trim().length > 0)
        const allResults: GenerationResult[] = []

        for (const singlePrompt of prompts.slice(0, 5)) { // Limit to 5 prompts
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: singlePrompt.trim(),
              seed: seed + allResults.length,
              creativity,
              batch: false
            })
          })

          if (!response.ok) {
            throw new Error(`Failed to generate image for: ${singlePrompt}`)
          }

          const data = await response.json()
          allResults.push(data.results)
        }

        setResults(allResults)
        setMessage(`Generated ${allResults.length} images successfully!`)
      } else {
        // Single or batch generation from single prompt
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt.trim(),
            seed,
            creativity,
            batch: batchCount > 1,
            batchCount
          })
        })

        if (!response.ok) {
          throw new Error('Failed to generate images')
        }

        const data = await response.json()
        const resultsArray = Array.isArray(data.results) ? data.results : [data.results]
        setResults(resultsArray)
        setMessage(`Generated ${resultsArray.length} image${resultsArray.length > 1 ? 's' : ''} successfully!`)
      }
    } catch (error: any) {
      setMessage(error.message || 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000))
  }

  const examplePrompts = [
    "A majestic dragon flying over a medieval castle at sunset",
    "A futuristic cityscape with flying cars and neon lights",
    "A serene forest lake with mountains in the background",
    "A steampunk robot working in an old workshop",
    "A magical underwater city with glowing coral reefs"
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Text to Design</h1>
        <p className="text-gray-600">
          Create stunning images from text descriptions using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mode Toggle */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Generation Mode</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mode"
                  value="single"
                  checked={!batchMode}
                  onChange={() => setBatchMode(false)}
                  className="mr-3"
                  disabled={generating}
                />
                <div>
                  <div className="font-medium text-gray-900">Single Prompt</div>
                  <div className="text-sm text-gray-500">Generate from one description</div>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mode"
                  value="batch"
                  checked={batchMode}
                  onChange={() => setBatchMode(true)}
                  className="mr-3"
                  disabled={generating}
                />
                <div>
                  <div className="font-medium text-gray-900">Batch Prompts</div>
                  <div className="text-sm text-gray-500">Generate from multiple descriptions</div>
                </div>
              </label>
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {batchMode ? 'Prompts (one per line)' : 'Prompt'}
            </h2>
            
            {batchMode ? (
              <textarea
                value={batchPrompts}
                onChange={(e) => setBatchPrompts(e.target.value)}
                placeholder="A red dragon in the mountains&#10;A peaceful garden scene&#10;A futuristic city at night"
                className="w-full h-32 border border-gray-300 rounded-md px-3 py-2 resize-none"
                disabled={generating}
              />
            ) : (
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to create..."
                className="w-full h-24 border border-gray-300 rounded-md px-3 py-2 resize-none"
                disabled={generating}
              />
            )}

            {/* Example Prompts */}
            {!batchMode && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Try these examples:</p>
                <div className="space-y-1">
                  {examplePrompts.slice(0, 3).map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(example)}
                      className="text-xs text-blue-600 hover:text-blue-800 block text-left"
                      disabled={generating}
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Basic Settings */}
          {!batchMode && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Images: {batchCount}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={batchCount}
                    onChange={(e) => setBatchCount(parseInt(e.target.value))}
                    className="w-full"
                    disabled={generating}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>4</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Creativity Level: {Math.round(creativity * 100)}%
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
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Conservative</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              disabled={generating}
            >
              <Cog6ToothIcon className="h-4 w-4 mr-1" />
              Advanced Settings
            </button>
            
            {showAdvanced && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md space-y-3">
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
                      onClick={randomizeSeed}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                      disabled={generating}
                    >
                      Random
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Same seed + prompt = same image
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={generateImages}
            disabled={generating || (!prompt.trim() && !batchPrompts.trim())}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {generating ? (
              <>
                <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5 mr-2" />
                Generate Images
              </>
            )}
          </button>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-md ${
              message.includes('failed') || message.includes('Failed')
                ? 'bg-red-50 text-red-700' 
                : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Generated Images</h2>
          
          {results.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No images yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter a prompt and generate your first image!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {results.map((result, index) => (
                <div key={result.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={result.imageUrl}
                      alt={`Generated: ${result.prompt}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      "{result.prompt}"
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Quality: {Math.round(result.attentionScore * 10)/10}/10</span>
                      <span>Seed: {result.seed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
