import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, tag, secret } = body

    // Validate secret token
    const revalidateSecret = process.env.REVALIDATE_SECRET
    if (!revalidateSecret || secret !== revalidateSecret) {
      return NextResponse.json(
        { error: 'Invalid secret token' },
        { status: 401 }
      )
    }

    // Revalidate by path or tag
    if (path) {
      revalidatePath(path)
      return NextResponse.json({
        message: `Revalidated path: ${path}`,
        revalidated: true,
        now: Date.now(),
      })
    }

    if (tag) {
      revalidateTag(tag)
      return NextResponse.json({
        message: `Revalidated tag: ${tag}`,
        revalidated: true,
        now: Date.now(),
      })
    }

    return NextResponse.json(
      { error: 'No path or tag provided' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Revalidation API endpoint',
    usage: 'POST with { path: "/path" } or { tag: "tag" } and secret',
    timestamp: new Date().toISOString(),
  })
}
