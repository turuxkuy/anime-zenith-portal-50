
// Make sure we have the supabase client available
console.log("Supabase config loading...");
if (typeof window.supabase === 'undefined') {
  console.log("Loading supabase from CDN");
}

// Supabase configuration
const supabaseUrl = 'https://eguwfitbjuzzwbgalwcx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndXdmaXRianV6endiZ2Fsd2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDQ4OTgsImV4cCI6MjA2MjEyMDg5OH0.nYgvViJgO67L5nNYEejoW5KajcXlryTThTzA1bvUO9k';

// Initialize Supabase client
// Make sure that supabaseClient is defined before using it
if (typeof supabaseClient === 'undefined' && typeof window.supabase !== 'undefined') {
  console.warn('Using window.supabase as supabaseClient is not defined');
  var supabaseClient = window.supabase;
}

try {
  // Create the Supabase client and make it globally available
  const supabase = supabaseClient.createClient(supabaseUrl, supabaseAnonKey);
  
  // Assign to window to ensure global availability
  window.supabase = supabase;
  
  // Log initialization to help with debugging
  console.log('Supabase client initialized with URL:', supabaseUrl);
  console.log('Supabase client object:', supabase ? 'Created successfully' : 'Failed to create');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

// Function to check if logged in - can be used across pages
async function checkLoginStatus() {
  try {
    if (typeof supabase === 'undefined') {
      console.error('Supabase is not defined in checkLoginStatus');
      return false;
    }
    
    const { data, error } = await supabase.auth.getSession();
    
    console.log('Auth session check:', data.session ? 'Session exists' : 'No session found');
    
    if (error) {
      console.error('Auth session error:', error);
      return false;
    }
    
    return !!data.session;
  } catch (err) {
    console.error('Error checking auth status:', err);
    return false;
  }
}

// Function to get user details - for displaying username, etc.
async function getCurrentUser() {
  try {
    if (typeof supabase === 'undefined') {
      console.error('Supabase is not defined in getCurrentUser');
      return null;
    }
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      console.log('No current user found');
      return null;
    }
    
    console.log('Current user ID:', data.session.user.id);
    return data.session.user;
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}
