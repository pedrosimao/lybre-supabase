import { createClient } from '@supabase/supabase-js'

const TABLE_NAME = 'kv_store_11f03654'

// Create a Supabase client with service role key for server-side operations
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Set stores a key-value pair in the database
export async function set(key: string, value: any): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase.from(TABLE_NAME).upsert({
    key,
    value,
  })
  if (error) {
    throw new Error(error.message)
  }
}

// Get retrieves a key-value pair from the database
export async function get(key: string): Promise<any> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('value')
    .eq('key', key)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return data?.value
}

// Delete deletes a key-value pair from the database
export async function del(key: string): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase.from(TABLE_NAME).delete().eq('key', key)
  if (error) {
    throw new Error(error.message)
  }
}

// Sets multiple key-value pairs in the database
export async function mset(keys: string[], values: any[]): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(keys.map((k, i) => ({ key: k, value: values[i] })))
  if (error) {
    throw new Error(error.message)
  }
}

// Gets multiple key-value pairs from the database
export async function mget(keys: string[]): Promise<any[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase.from(TABLE_NAME).select('value').in('key', keys)
  if (error) {
    throw new Error(error.message)
  }
  return data?.map(d => d.value) ?? []
}

// Deletes multiple key-value pairs from the database
export async function mdel(keys: string[]): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase.from(TABLE_NAME).delete().in('key', keys)
  if (error) {
    throw new Error(error.message)
  }
}

// Search for key-value pairs by prefix
export async function getByPrefix(prefix: string): Promise<any[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('key, value')
    .like('key', prefix + '%')
  if (error) {
    throw new Error(error.message)
  }
  return data?.map(d => d.value) ?? []
}
