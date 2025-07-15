export const environment = {
  production: true,
  openai: {
    apiKey: process.env['OPENAI_API_KEY'] || ''
  },
  supabase: {
    url: process.env['SUPABASE_URL'] || '',
    anonKey: process.env['SUPABASE_ANON_KEY'] || ''
  }
}; 