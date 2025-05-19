
-- Create a stored procedure to update user roles safely
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the role is valid
  IF new_role NOT IN ('user', 'vip', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Update the user's role
  UPDATE public.profiles
  SET role = new_role
  WHERE id = user_id;

  -- Return success if at least one row was updated
  RETURN FOUND;
END;
$$;

-- Create or replace function to update expired VIP users
CREATE OR REPLACE FUNCTION public.update_expired_vip_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Update expired VIP users to regular status
  WITH updated AS (
    UPDATE public.profiles
    SET role = 'user'
    WHERE role = 'vip' 
      AND vip_expired_at IS NOT NULL 
      AND vip_expired_at < now()
    RETURNING id
  )
  SELECT COUNT(*) INTO affected_count FROM updated;
  
  -- Return the number of users affected
  RETURN jsonb_build_object('updated_count', affected_count);
END;
$function$;
