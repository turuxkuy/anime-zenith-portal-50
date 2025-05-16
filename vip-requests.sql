

-- This SQL creates the VIP requests table and function
-- Admin can run this in Supabase SQL Editor

-- Create the vip_requests table if it doesn't exist
create or replace function public.ensure_vip_requests_table()
returns void
language plpgsql as
$$
begin
  -- Check if the table exists
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'vip_requests') then
    -- Create the table
    create table public.vip_requests (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      username text not null,
      status text not null default 'pending',
      created_at timestamp with time zone not null default now(),
      updated_at timestamp with time zone not null default now()
    );

    -- Add RLS policies
    alter table public.vip_requests enable row level security;
    
    -- Users can only see their own requests
    create policy "Users can view their own requests" on vip_requests
      for select using (auth.uid() = user_id);
      
    -- Users can only insert their own requests
    create policy "Users can create their own requests" on vip_requests
      for insert with check (auth.uid() = user_id);
      
    -- Only admins can update requests
    create policy "Only admins can update requests" on vip_requests
      for update using (
        exists (
          select 1 from profiles where id = auth.uid() and role = 'admin'
        )
      );
  end if;
end;
$$;

-- Add a function to check for VIP requests
create or replace function public.handle_vip_request(
  requestId uuid,
  newStatus text,
  expirationDays integer default 30
)
returns jsonb
language plpgsql security definer as
$$
declare
  request_record record;
  expiration_date timestamp with time zone;
begin
  -- Get the request record
  select * into request_record from public.vip_requests where id = requestId;
  
  if not found then
    return jsonb_build_object('success', false, 'message', 'VIP request not found');
  end if;
  
  -- Calculate expiration date if status is approved
  if newStatus = 'approved' then
    expiration_date := now() + (expirationDays || ' days')::interval;
    
    -- Update the user's role to VIP
    update public.profiles
    set role = 'vip', expiration_date = handle_vip_request.expiration_date
    where id = request_record.user_id;
  end if;
  
  -- Update the request status
  update public.vip_requests
  set status = newStatus, updated_at = now()
  where id = requestId;
  
  return jsonb_build_object(
    'success', true, 
    'message', 'VIP request ' || newStatus,
    'user_id', request_record.user_id,
    'expiration_date', expiration_date
  );
end;
$$;

