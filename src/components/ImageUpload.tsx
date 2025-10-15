'use client'

import { useCallback, useState } from 'react'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  accept?: string
  label?: string
  disabled?: boolean
}

export default function ImageUpload({ 
  onImageSelect, 
  accept = "image/*",
  label = "Upload Image",
  disabled = false 
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      onImageSelect(files[0])
    }
  }, [onImageSelect])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled) return
    handleFiles(e.dataTransfer.files)
  }, [disabled, handleFiles])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    handleFiles(e.target.files)
  }, [disabled, handleFiles])

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition-colors ${
        dragActive 
          ? 'border-blue-500 bg-blue-50' 
          : disabled 
          ? 'border-gray-200 bg-gray-100' 
          : 'border-gray-300'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
      />
      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        <span className="font-medium text-blue-600 hover:text-blue-500">
          {label}
        </span>{' '}
        or drag and drop
      </p>
      <p className="text-xs text-gray-500">
        PNG, JPG, GIF up to 10MB
      </p>
    </div>
  )
}
