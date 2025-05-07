
// Supabase configuration
const supabaseUrl = 'https://eguwfitbjuzzwbgalwcx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndXdmaXRianV6endiZ2Fsd2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDQ4OTgsImV4cCI6MjA2MjEyMDg5OH0.nYgvViJgO67L5nNYEejoW5KajcXlryTThTzA1bvUO9k';

// Initialize Supabase client
const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
