
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

-- Execute the function to ensure the table exists
select ensure_vip_requests_table();

-- Add function to process VIP requests (approve/reject)
create or replace function public.process_vip_request(
  request_id uuid,
  new_status text,
  admin_id uuid,
  expiration_days int default 30
)
returns json
language plpgsql security definer as
$$
declare
  request_info record;
  expiration_date timestamp with time zone;
  result json;
begin
  -- Verify admin status
  if not exists (select 1 from profiles where id = admin_id and role = 'admin') then
    return json_build_object('success', false, 'message', 'Only admins can process VIP requests');
  end if;
  
  -- Get the request info
  select vr.* into request_info
  from vip_requests vr
  where vr.id = request_id;
  
  if not found then
    return json_build_object('success', false, 'message', 'VIP request not found');
  end if;
  
  -- Calculate expiration date if approving
  if new_status = 'approved' then
    expiration_date := now() + (expiration_days || ' days')::interval;
    
    -- Update user role to VIP
    update profiles
    set role = 'vip',
        expiration_date = process_vip_request.expiration_date
    where id = request_info.user_id;
  end if;
  
  -- Update the request status
  update vip_requests
  set status = new_status,
      updated_at = now()
  where id = request_id;
  
  return json_build_object(
    'success', true, 
    'message', 'Request processed successfully',
    'status', new_status,
    'user_id', request_info.user_id,
    'expiration_date', expiration_date
  );
end;
$$;

-- Create function to handle requesting VIP access
create or replace function public.request_vip_access()
returns json
language plpgsql security definer as
$$
declare
  user_info record;
begin
  -- Get user info
  select p.id, p.username, p.role 
  into user_info
  from profiles p
  where p.id = auth.uid();
  
  if not found then
    return json_build_object('success', false, 'message', 'User not found');
  end if;
  
  -- Check if user is already VIP
  if user_info.role = 'vip' then
    return json_build_object('success', false, 'message', 'You are already a VIP user');
  end if;
  
  -- Check if user already has a pending request
  if exists (
    select 1 
    from vip_requests 
    where user_id = auth.uid() and status = 'pending'
  ) then
    return json_build_object('success', false, 'message', 'You already have a pending VIP request');
  end if;
  
  -- Create a new VIP request
  insert into vip_requests (user_id, username)
  values (auth.uid(), user_info.username);
  
  return json_build_object('success', true, 'message', 'VIP request submitted successfully');
end;
$$;
