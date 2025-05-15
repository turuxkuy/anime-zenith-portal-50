
// Edge function to check and downgrade expired VIP users
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    console.log('Starting check for expired VIP users')
    
    // Create Supabase client with service role key (admin privileges)
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials')
    }
    
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get all VIP users with expiration dates in the past
    const now = new Date().toISOString()
    
    // Find users to downgrade
    const { data: expiredUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, expiration_date')
      .eq('role', 'vip')
      .lt('expiration_date', now) // Less than now = expired
    
    if (fetchError) {
      throw fetchError
    }
    
    console.log(`Found ${expiredUsers?.length || 0} expired VIP users`)
    
    let downgradedCount = 0
    
    if (expiredUsers && expiredUsers.length > 0) {
      // Downgrade users in batches if many
      for (const user of expiredUsers) {
        console.log(`Downgrading user ${user.username} (${user.id}) with expiration ${user.expiration_date}`)
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: 'user', 
            expiration_date: null 
          })
          .eq('id', user.id)
        
        if (updateError) {
          console.error(`Error downgrading user ${user.id}:`, updateError)
        } else {
          downgradedCount++
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Checked for expired VIP users. Downgraded ${downgradedCount} of ${expiredUsers?.length || 0} expired users.` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error checking VIP expirations:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
