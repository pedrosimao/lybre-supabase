import type { SupabaseClient } from '@supabase/supabase-js'

const TABLE_NAME = 'kv_store_11f03654'

// Set stores a key-value pair in the database
export async function set(supabase: SupabaseClient, key: string, value: any): Promise<void> {
  const { error } = await supabase.from(TABLE_NAME).upsert({
    key,
    value,
  })
  if (error) {
    throw new Error(error.message)
  }
}

// Get retrieves a key-value pair from the database
export async function get(supabase: SupabaseClient, key: string): Promise<any> {
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
export async function del(supabase: SupabaseClient, key: string): Promise<void> {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('key', key)
  if (error) {
    throw new Error(error.message)
  }
}

// Sets multiple key-value pairs in the database
export async function mset(
  supabase: SupabaseClient,
  keys: string[],
  values: any[]
): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(keys.map((k, i) => ({ key: k, value: values[i] })))
  if (error) {
    throw new Error(error.message)
  }
}

// Gets multiple key-value pairs from the database
export async function mget(supabase: SupabaseClient, keys: string[]): Promise<any[]> {
  const { data, error } = await supabase.from(TABLE_NAME).select('value').in('key', keys)
  if (error) {
    throw new Error(error.message)
  }
  return data?.map(d => d.value) ?? []
}

// Deletes multiple key-value pairs from the database
export async function mdel(supabase: SupabaseClient, keys: string[]): Promise<void> {
  const { error } = await supabase.from(TABLE_NAME).delete().in('key', keys)
  if (error) {
    throw new Error(error.message)
  }
}

// Search for key-value pairs by prefix
export async function getByPrefix(supabase: SupabaseClient, prefix: string): Promise<any[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('key, value')
    .like('key', prefix + '%')
  if (error) {
    throw new Error(error.message)
  }
  return data?.map(d => d.value) ?? []
}
