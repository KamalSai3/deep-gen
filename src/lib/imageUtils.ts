// Calculate attention score (simple sharpness metric)
export const calculateAttentionScore = (canvas: HTMLCanvasElement): number => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return 0
  
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
  
    let sum = 0
    let count = 0
  
    // Simple Laplacian filter for sharpness detection
    for (let i = canvas.width + 4; i < data.length - canvas.width * 4 - 4; i += 4) {
      const center = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      const top = data[i - canvas.width * 4] * 0.299 + data[i - canvas.width * 4 + 1] * 0.587 + data[i - canvas.width * 4 + 2] * 0.114
      const bottom = data[i + canvas.width * 4] * 0.299 + data[i + canvas.width * 4 + 1] * 0.587 + data[i + canvas.width * 4 + 2] * 0.114
      const left = data[i - 4] * 0.299 + data[i - 3] * 0.587 + data[i - 2] * 0.114
      const right = data[i + 4] * 0.299 + data[i + 5] * 0.587 + data[i + 6] * 0.114
  
      const laplacian = Math.abs(4 * center - top - bottom - left - right)
      sum += laplacian
      count++
    }
  
    return count > 0 ? Math.min(sum / count / 50, 10) : 0 // Normalize to 0-10 range
  }
  
  // Convert File to data URL for preview
  export const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  // Upload image to Supabase Storage
  export const uploadImageToStorage = async (
    supabase: any,
    file: File,
    bucket: string,
    fileName: string
  ): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
  
    if (error) throw error
  
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)
  
    return publicUrl
  }
  
  // Simple restoration filter (placeholder - increases contrast and reduces noise)
  export const applyRestorationFilter = (
    canvas: HTMLCanvasElement,
    strength: number = 0.5
  ): void => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
  
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
  
    for (let i = 0; i < data.length; i += 4) {
      // Increase contrast
      const contrast = 1 + strength * 0.5
      data[i] = Math.min(255, (data[i] - 128) * contrast + 128)     // Red
      data[i + 1] = Math.min(255, (data[i + 1] - 128) * contrast + 128) // Green
      data[i + 2] = Math.min(255, (data[i + 2] - 128) * contrast + 128) // Blue
  
      // Simple noise reduction (slight blur)
      if (strength > 0.3) {
        const blur = strength * 0.2
        data[i] = data[i] * (1 - blur) + 128 * blur
        data[i + 1] = data[i + 1] * (1 - blur) + 128 * blur
        data[i + 2] = data[i + 2] * (1 - blur) + 128 * blur
      }
    }
  
    ctx.putImageData(imageData, 0, 0)
  }

// Super-resolution simulation (upscaling with sharpening)
export const applySuperResolution = (
    canvas: HTMLCanvasElement,
    scale: number = 2
  ): void => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
  
    const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newWidth = canvas.width * scale
    const newHeight = canvas.height * scale
    
    // Resize canvas
    canvas.width = newWidth
    canvas.height = newHeight
    
    // Scale up using bilinear interpolation
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = originalImageData.width
    tempCanvas.height = originalImageData.height
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.putImageData(originalImageData, 0, 0)
    
    ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight)
    
    // Apply sharpening filter
    const imageData = ctx.getImageData(0, 0, newWidth, newHeight)
    const data = imageData.data
    const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]
    
    for (let i = newWidth + 4; i < data.length - newWidth * 4 - 4; i += 4) {
      for (let channel = 0; channel < 3; channel++) {
        let sum = 0
        let kernelIndex = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const pixelIndex = i + (dy * newWidth + dx) * 4 + channel
            sum += data[pixelIndex] * sharpenKernel[kernelIndex]
            kernelIndex++
          }
        }
        data[i + channel] = Math.max(0, Math.min(255, sum))
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
  }
  
  // Style transfer simulation (color tone adjustment)
  export const applyStyleTransfer = (
    canvas: HTMLCanvasElement,
    style: string,
    intensity: number = 0.5
  ): void => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
  
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
  
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]
  
      switch (style) {
        case 'vintage':
          // Sepia-like effect
          r = Math.min(255, (r * 0.393 + g * 0.769 + b * 0.189) * intensity + r * (1 - intensity))
          g = Math.min(255, (r * 0.349 + g * 0.686 + b * 0.168) * intensity + g * (1 - intensity))
          b = Math.min(255, (r * 0.272 + g * 0.534 + b * 0.131) * intensity + b * (1 - intensity))
          break
        case 'cool':
          // Blue tint
          r = r * (1 - intensity * 0.2)
          g = g * (1 - intensity * 0.1)
          b = Math.min(255, b * (1 + intensity * 0.3))
          break
        case 'warm':
          // Orange/red tint
          r = Math.min(255, r * (1 + intensity * 0.3))
          g = Math.min(255, g * (1 + intensity * 0.1))
          b = b * (1 - intensity * 0.2)
          break
        case 'vivid':
          // Increase saturation
          const gray = 0.299 * r + 0.587 * g + 0.114 * b
          r = Math.min(255, gray + (r - gray) * (1 + intensity))
          g = Math.min(255, gray + (g - gray) * (1 + intensity))
          b = Math.min(255, gray + (b - gray) * (1 + intensity))
          break
        case 'monochrome':
          // Convert to grayscale
          const mono = 0.299 * r + 0.587 * g + 0.114 * b
          r = mono * (1 - intensity) + r * intensity
          g = mono * (1 - intensity) + g * intensity
          b = mono * (1 - intensity) + b * intensity
          break
      }
  
      data[i] = Math.max(0, Math.min(255, r))
      data[i + 1] = Math.max(0, Math.min(255, g))
      data[i + 2] = Math.max(0, Math.min(255, b))
    }
  
    ctx.putImageData(imageData, 0, 0)
  }
  
  // Colorization simulation (for grayscale images)
  export const applyColorization = (
    canvas: HTMLCanvasElement,
    colorScheme: string,
    intensity: number = 0.5
  ): void => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
  
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
  
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
  
      let newR = r, newG = g, newB = b
  
      switch (colorScheme) {
        case 'natural':
          // Natural skin tones and environment
          newR = gray * (1 + intensity * 0.2)
          newG = gray * (1 + intensity * 0.1)
          newB = gray * (1 - intensity * 0.1)
          break
        case 'cool':
          // Cool blue tones
          newR = gray * (1 - intensity * 0.3)
          newG = gray
          newB = gray * (1 + intensity * 0.4)
          break
        case 'warm':
          // Warm orange/yellow tones
          newR = gray * (1 + intensity * 0.4)
          newG = gray * (1 + intensity * 0.2)
          newB = gray * (1 - intensity * 0.2)
          break
      }
  
      data[i] = Math.max(0, Math.min(255, newR))
      data[i + 1] = Math.max(0, Math.min(255, newG))
      data[i + 2] = Math.max(0, Math.min(255, newB))
    }
  
    ctx.putImageData(imageData, 0, 0)
  }
  