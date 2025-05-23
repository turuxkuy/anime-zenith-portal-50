
// update-user-role function
// Securely updates a user's role with admin privileges
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
    // Create Supabase client with service role key (admin privileges)
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

    // Get request data
    const requestData = await req.json()
    const { userId, newRole, adminId, expirationDate } = requestData
    
    console.log('Request data:', { userId, newRole, adminId, expirationDate })
    
    if (!userId || !newRole || !adminId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Validate that the requesting user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminId)
      .single()
      
    if (adminError || !adminData || adminData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only admins can update user roles' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }
    
    // Validate that newRole is one of allowed values
    const validRoles = ['user', 'vip', 'admin']
    if (!validRoles.includes(newRole)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role specified' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Log the operation attempt
    console.log(`Admin ${adminId} attempting to update user ${userId} to role ${newRole}`)
    
    // Prepare update data
    const updateData = { role: newRole }
    
    // If role is VIP and expiration date is provided, set it
    if (newRole === 'vip' && expirationDate) {
      updateData.expiration_date = expirationDate
      console.log(`Setting expiration date: ${expirationDate}`)
    } else if (newRole === 'user') {
      // If changing from VIP to regular user, clear the expiration date
      updateData.expiration_date = null
      console.log('Clearing expiration date for regular user')
    }
    
    console.log('Update data:', updateData)
    
    // Update the user profile directly
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      
    if (error) {
      console.error('Error updating role:', error)
      return new Response(
        JSON.stringify({ error: `Failed to update role: ${error.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    console.log('Role update successful:', data)
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
