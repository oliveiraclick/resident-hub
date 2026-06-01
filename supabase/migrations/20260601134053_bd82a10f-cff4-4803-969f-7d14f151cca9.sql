-- Grant access to authenticated users and service_role
GRANT SELECT, INSERT, UPDATE ON public.copa_palpites TO authenticated;
GRANT ALL ON public.copa_palpites TO service_role;

-- Enable RLS (already enabled but good to be sure)
ALTER TABLE public.copa_palpites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view their own bets" ON public.copa_palpites;
DROP POLICY IF EXISTS "Users can insert their own bets" ON public.copa_palpites;

-- Re-create user policies
CREATE POLICY "Users can view their own bets" 
ON public.copa_palpites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bets" 
ON public.copa_palpites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create platform_admin policies
CREATE POLICY "Platform admins can view all bets" 
ON public.copa_palpites 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'platform_admin'
  )
);

CREATE POLICY "Platform admins can update all bets" 
ON public.copa_palpites 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'platform_admin'
  )
);
