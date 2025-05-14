
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
