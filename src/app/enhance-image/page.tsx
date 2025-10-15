'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import ImageUpload from '@/components/ImageUpload'
import { 
  fileToDataURL, 
  uploadImageToStorage, 
  applySuperResolution,
  applyStyleTransfer,
  applyColorization,
  calculateAttentionScore 
} from '@/lib/imageUtils'
import { 
  PaintBrushIcon, 
  ArrowPathIcon,
  MagnifyingGlassPlusIcon,
  SwatchIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

type EnhancementType = 'super-resolution' | 'style-transfer' | 'colorization'
type StyleType = 'vintage' | 'cool' | 'warm' | 'vivid' | 'monochrome'
type ColorScheme = 'natural' | 'cool' | 'warm'

export default function EnhanceImagePage() {
  const { user } = useAuth()
  const [originalImage, setOriginalImage] = useState<File | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string>('')
  const [enhancedPreview, setEnhancedPreview] = useState<string>('')
  
  // Enhancement settings
  const [enhancementType, setEnhancementType] = useState<EnhancementType>('super-resolution')
  const [upscaleFactor, setUpscaleFactor] = useState(2)
  const [styleType, setStyleType] = useState<StyleType>('vivid')
  const [colorScheme, setColorScheme] = useState<ColorScheme>('natural')
  const [intensity, setIntensity] = useState(0.5)
  
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageSelect = async (file: File) => {
    try {
      setOriginalImage(file)
      const preview = await fileToDataURL(file)
      setOriginalPreview(preview)
      setEnhancedPreview('') // Clear previous enhancement
      setMessage('')
    } catch (error) {
      setMessage('Error loading image. Please try again.')
    }
  }

  const processEnhancement = async () => {
    if (!originalImage || !canvasRef.current || !originalCanvasRef.current) return

    setProcessing(true)
    setMessage('Processing your image...')

    try {
      const canvas = canvasRef.current
      const originalCanvas = originalCanvasRef.current
      const ctx = canvas.getContext('2d')
      const originalCtx = originalCanvas.getContext('2d')
      
      if (!ctx || !originalCtx) throw new Error('Canvas not available')

      // Load image into original canvas first
      const img = new Image()
      img.onload = () => {
        // Set original canvas size
        originalCanvas.width = img.width
        originalCanvas.height = img.height
        originalCtx.drawImage(img, 0, 0)
        
        // Copy to processing canvas
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        // Apply selected enhancement
        switch (enhancementType) {
          case 'super-resolution':
            applySuperResolution(canvas, upscaleFactor)
            break
          case 'style-transfer':
            applyStyleTransfer(canvas, styleType, intensity)
            break
          case 'colorization':
            applyColorization(canvas, colorScheme, intensity)
            break
        }
        
        // Get enhanced image as data URL
        const enhancedDataURL = canvas.toDataURL('image/jpeg', 0.9)
        setEnhancedPreview(enhancedDataURL)
        setMessage('Enhancement complete!')
        setProcessing(false)
      }
      img.src = originalPreview
    } catch (error) {
      setMessage('Error processing image. Please try again.')
      setProcessing(false)
    }
  }

  const saveEnhancement = async () => {
    if (!user || !originalImage || !enhancedPreview || !canvasRef.current) return

    setSaving(true)
    setMessage('Saving your enhancement...')

    try {
      // Convert canvas to blob
      const canvas = canvasRef.current
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9)
      })
      
      // Create file from blob
      const enhancedFile = new File([blob], `enhanced_${originalImage.name}`, {
        type: 'image/jpeg'
      })

      // Upload original image
      const originalFileName = `${user.id}/${Date.now()}_original_${originalImage.name}`
      const originalUrl = await uploadImageToStorage(
        supabase, 
        originalImage, 
        'enhanced-images', 
        originalFileName
      )

      // Upload enhanced image
      const enhancedFileName = `${user.id}/${Date.now()}_enhanced_${originalImage.name}`
      const enhancedUrl = await uploadImageToStorage(
        supabase, 
        enhancedFile, 
        'enhanced-images', 
        enhancedFileName
      )

      // Save to database
      const { error } = await supabase
        .from('enhancements')
        .insert({
          user_id: user.id,
          original_image_url: originalUrl,
          enhanced_image_url: enhancedUrl,
          enhancement_type: enhancementType,
          style_applied: enhancementType === 'style-transfer' ? styleType : 
                        enhancementType === 'colorization' ? colorScheme : null,
          upscale_factor: enhancementType === 'super-resolution' ? upscaleFactor : null,
        })

      if (error) throw error

      setMessage('Enhancement saved successfully!')
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setOriginalImage(null)
        setOriginalPreview('')
        setEnhancedPreview('')
        setMessage('')
      }, 2000)

    } catch (error: any) {
      setMessage(error.message || 'Error saving enhancement. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const enhancementOptions = [
    { 
      id: 'super-resolution', 
      name: 'Super Resolution', 
      description: 'Upscale and sharpen your image',
      icon: MagnifyingGlassPlusIcon 
    },
    { 
      id: 'style-transfer', 
      name: 'Style Transfer', 
      description: 'Apply artistic style effects',
      icon: PaintBrushIcon 
    },
    { 
      id: 'colorization', 
      name: 'Colorization', 
      description: 'Add color to grayscale images',
      icon: SwatchIcon 
    }
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhance Image</h1>
        <p className="text-gray-600">
          Improve your images with AI-powered enhancement tools
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Section */}
        <div className="space-y-6">
          {/* Upload */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              1. Upload Your Image
            </h2>
            <ImageUpload
              onImageSelect={handleImageSelect}
              label="Choose image to enhance"
              disabled={processing || saving}
            />
          </div>

          {/* Enhancement Type */}
          {originalImage && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                2. Choose Enhancement Type
              </h2>
              <div className="space-y-3">
                {enhancementOptions.map((option) => (
                  <label key={option.id} className="flex items-center">
                    <input
                      type="radio"
                      name="enhancement"
                      value={option.id}
                      checked={enhancementType === option.id}
                      onChange={(e) => setEnhancementType(e.target.value as EnhancementType)}
                      className="mr-3"
                      disabled={processing || saving}
                    />
                    <option.icon className="h-5 w-5 mr-2 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{option.name}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Enhancement Settings */}
          {originalImage && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                3. Adjustment Settings
              </h2>
              
              {/* Super Resolution Settings */}
              {enhancementType === 'super-resolution' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upscale Factor: {upscaleFactor}x
                    </label>
                    <select
                      value={upscaleFactor}
                      onChange={(e) => setUpscaleFactor(parseInt(e.target.value))}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2"
                      disabled={processing || saving}
                    >
                      <option value={2}>2x (Double size)</option>
                      <option value={3}>3x (Triple size)</option>
                      <option value={4}>4x (Quadruple size)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Style Transfer Settings */}
              {enhancementType === 'style-transfer' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Style Type
                    </label>
                    <select
                      value={styleType}
                      onChange={(e) => setStyleType(e.target.value as StyleType)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2"
                      disabled={processing || saving}
                    >
                      <option value="vintage">Vintage</option>
                      <option value="cool">Cool Tones</option>
                      <option value="warm">Warm Tones</option>
                      <option value="vivid">Vivid Colors</option>
                      <option value="monochrome">Monochrome</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intensity: {Math.round(intensity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={intensity}
                      onChange={(e) => setIntensity(parseFloat(e.target.value))}
                      className="w-full"
                      disabled={processing || saving}
                    />
                  </div>
                </div>
              )}

              {/* Colorization Settings */}
              {enhancementType === 'colorization' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color Scheme
                    </label>
                    <select
                      value={colorScheme}
                      onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2"
                      disabled={processing || saving}
                    >
                      <option value="natural">Natural</option>
                      <option value="cool">Cool Blues</option>
                      <option value="warm">Warm Oranges</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intensity: {Math.round(intensity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={intensity}
                      onChange={(e) => setIntensity(parseFloat(e.target.value))}
                      className="w-full"
                      disabled={processing || saving}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={processEnhancement}
                disabled={processing || saving}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processing ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PaintBrushIcon className="h-5 w-5 mr-2" />
                    Enhance Image
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Preview</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Original Preview */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Original</h3>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {originalPreview ? (
                  <img 
                    src={originalPreview} 
                    alt="Original" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <PhotoIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Preview */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Enhanced</h3>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {enhancedPreview ? (
                  <img 
                    src={enhancedPreview} 
                    alt="Enhanced" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <PhotoIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          {enhancedPreview && (
            <button
              onClick={saveEnhancement}
              disabled={saving}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Enhancement'}
            </button>
          )}

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-md ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-700' 
                : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvases for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={originalCanvasRef} style={{ display: 'none' }} />
    </div>
  )
}
