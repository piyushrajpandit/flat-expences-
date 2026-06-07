import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    })
  : null

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase URL or Service Role Key missing' }, { status: 500 })
  }

  try {
    const { data, error } = await supabase
      .from('flat_ledger')
      .select('*')
      .eq('id', 'default')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        const initialRow = {
          id: 'default',
          flat_name: 'My Shared Flat',
          expenses: [],
          settlements: [],
          last_change_by: 'System',
          last_change_action: 'Ledger Initialized'
        }
        const { data: insertedData, error: insertError } = await supabase
          .from('flat_ledger')
          .insert([initialRow])
          .select()
          .single()

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
        return NextResponse.json(insertedData)
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase URL or Service Role Key missing' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { flat_name, expenses, settlements, last_change_by, last_change_action } = body

    const { data, error } = await supabase
      .from('flat_ledger')
      .update({
        flat_name,
        expenses,
        settlements,
        last_change_by,
        last_change_action,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'default')
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
