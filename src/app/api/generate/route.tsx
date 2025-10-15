import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// For MVP, we'll simulate image generation with placeholder images
// In production, this would integrate with Stable Diffusion XL or similar
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1546975490-e8b92a360b24?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=512&h=512&fit=crop',
]

function generateImageFromPrompt(prompt: string, seed: number, creativity: number): string {
  // Simple hash function to make images consistent for same prompts
  let hash = 0
  const combined = prompt + seed.toString()
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % PLACEHOLDER_IMAGES.length
  return PLACEHOLDER_IMAGES[index]
}

function calculateMockAttentionScore(prompt: string, creativity: number): number {
  // Mock attention score based on prompt complexity and creativity
  const wordCount = prompt.split(' ').length
  const complexity = Math.min(wordCount / 10, 1)
  const creativityBonus = creativity * 0.3
  const randomFactor = Math.random() * 0.2
  
  return Math.min(Math.max(complexity + creativityBonus + randomFactor, 0.1), 1) * 10
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, seed = Math.floor(Math.random() * 1000000), creativity = 0.5, batch = false, batchCount = 1 } = body

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

    const results = []
    const actualBatchCount = batch ? Math.min(batchCount, 4) : 1

    for (let i = 0; i < actualBatchCount; i++) {
      const currentSeed = seed + i
      const imageUrl = generateImageFromPrompt(prompt, currentSeed, creativity)
      const attentionScore = calculateMockAttentionScore(prompt, creativity)

      // Save to database
      const { data: generation, error } = await supabase
        .from('generations')
        .insert({
          user_id: session.user.id,
          model_type: 'text-to-design-sdxl',
          input_prompt: prompt.trim(),
          output_image_url: imageUrl,
          attention_score: attentionScore,
          seed_value: currentSeed,
          creativity_level: creativity,
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to save generation' }, { status: 500 })
      }

      results.push({
        id: generation.id,
        imageUrl: imageUrl,
        attentionScore: attentionScore,
        seed: currentSeed,
        prompt: prompt.trim()
      })
    }

    return NextResponse.json({ 
      success: true, 
      results: batch ? results : results[0]
    })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
