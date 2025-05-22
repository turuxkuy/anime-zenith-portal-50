
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

console.log("Create user function started")

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing create-user request");
    
    // Create a Supabase client with the service role key (for admin operations)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    if (!supabase) {
      console.error("Failed to initialize Supabase client");
      throw new Error('Failed to initialize Supabase client');
    }
    
    // Parse the request body
    const body = await req.json();
    const { email, password, username, role = 'user' } = body;
    
    console.log("Request data received:", { email, username, role });
    
    // Validate inputs
    if (!email || !password || !username) {
      console.error("Missing required fields");
      throw new Error('Email, password, and username are required');
    }
    
    // Check if user already exists by email
    const { data: existingUsers, error: checkError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking for existing user:", checkError);
      throw new Error(`Error checking for existing user: ${checkError.message}`);
    }
    
    if (existingUsers) {
      console.error("User with this email already exists");
      throw new Error('User with this email already exists');
    }
    
    // Create the user with admin API
    console.log("Creating user with email:", email);
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username
      }
    });
    
    if (userError) {
      console.error("Error creating user:", userError);
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    if (!userData?.user?.id) {
      console.error("No user ID returned after creation");
      throw new Error('User creation failed: No user ID returned');
    }

    console.log("User created successfully with ID:", userData.user.id);

    // We don't need to manually insert the profile as the trigger should do it
    // But we update the role if it's different from the default
    if (role !== 'user') {
      console.log(`Updating role to ${role} for user ${userData.user.id}`);
      
      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userData.user.id);
      
      if (profileError) {
        console.error("Error updating profile role:", profileError);
        // Don't delete the user, just log the error
        console.log("User created but role update failed");
      } else {
        console.log("Profile role updated successfully");
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        message: "User created successfully", 
        user: userData?.user 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201 
      }
    );
  } catch (error) {
    console.error("Error in create-user function:", error);
    
    // Return a proper error response
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
})
