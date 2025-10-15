'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import ImageUpload from '@/components/ImageUpload'
import { 
  fileToDataURL, 
  uploadImageToStorage, 
  applyRestorationFilter, 
  calculateAttentionScore 
} from '@/lib/imageUtils'
import { PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function PhotoRestorePage() {
  const { user } = useAuth()
  const [originalImage, setOriginalImage] = useState<File | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string>('')
  const [restoredPreview, setRestoredPreview] = useState<string>('')
  const [restorationStrength, setRestorationStrength] = useState(0.5)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleImageSelect = async (file: File) => {
    try {
      setOriginalImage(file)
      const preview = await fileToDataURL(file)
      setOriginalPreview(preview)
      setRestoredPreview('') // Clear previous restoration
      setMessage('')
    } catch (error) {
      setMessage('Error loading image. Please try again.')
    }
  }

  const processRestoration = async () => {
    if (!originalImage || !canvasRef.current) return

    setProcessing(true)
    setMessage('Processing your image...')

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not available')

      // Load image into canvas
      const img = new Image()
      img.onload = () => {
        // Set canvas size to image size
        canvas.width = img.width
        canvas.height = img.height
        
        // Draw original image
        ctx.drawImage(img, 0, 0)
        
        // Apply restoration filter
        applyRestorationFilter(canvas, restorationStrength)
        
        // Get restored image as data URL
        const restoredDataURL = canvas.toDataURL('image/jpeg', 0.9)
        setRestoredPreview(restoredDataURL)
        setMessage('Restoration complete!')
        setProcessing(false)
      }
      img.src = originalPreview
    } catch (error) {
      setMessage('Error processing image. Please try again.')
      setProcessing(false)
    }
  }

  const saveRestoration = async () => {
    if (!user || !originalImage || !restoredPreview || !canvasRef.current) return

    setSaving(true)
    setMessage('Saving your restoration...')

    try {
      // Convert canvas to blob
      const canvas = canvasRef.current
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9)
      })
      
      // Create file from blob
      const restoredFile = new File([blob], `restored_${originalImage.name}`, {
        type: 'image/jpeg'
      })

      // Upload original image
      const originalFileName = `${user.id}/${Date.now()}_original_${originalImage.name}`
      const originalUrl = await uploadImageToStorage(
        supabase, 
        originalImage, 
        'restored-images', 
        originalFileName
      )

      // Upload restored image
      const restoredFileName = `${user.id}/${Date.now()}_restored_${originalImage.name}`
      const restoredUrl = await uploadImageToStorage(
        supabase, 
        restoredFile, 
        'restored-images', 
        restoredFileName
      )

      // Calculate attention score
      const attentionScore = calculateAttentionScore(canvas)

      // Save to database
      const { error } = await supabase
        .from('restores')
        .insert({
          user_id: user.id,
          original_image_url: originalUrl,
          restored_image_url: restoredUrl,
          restoration_strength: restorationStrength,
        })

      if (error) throw error

      setMessage('Restoration saved successfully!')
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setOriginalImage(null)
        setOriginalPreview('')
        setRestoredPreview('')
        setMessage('')
      }, 2000)

    } catch (error: any) {
      setMessage(error.message || 'Error saving restoration. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Photo Restore</h1>
        <p className="text-gray-600">
          Upload a damaged or old photo to restore it using AI enhancement
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              1. Upload Your Image
            </h2>
            <ImageUpload
              onImageSelect={handleImageSelect}
              label="Choose damaged photo"
              disabled={processing || saving}
            />
          </div>

          {/* Controls */}
          {originalImage && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                2. Restoration Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restoration Strength: {Math.round(restorationStrength * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={restorationStrength}
                    onChange={(e) => setRestorationStrength(parseFloat(e.target.value))}
                    className="w-full"
                    disabled={processing || saving}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Gentle</span>
                    <span>Strong</span>
                  </div>
                </div>

                <button
                  onClick={processRestoration}
                  disabled={processing || saving || !originalImage}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <PhotoIcon className="h-5 w-5 mr-2" />
                      Restore Photo
                    </>
                  )}
                </button>
              </div>
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

            {/* Restored Preview */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Restored</h3>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {restoredPreview ? (
                  <img 
                    src={restoredPreview} 
                    alt="Restored" 
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
          {restoredPreview && (
            <button
              onClick={saveRestoration}
              disabled={saving}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Restoration'}
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

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
