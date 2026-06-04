ALTER TABLE public.copa_palpites
ADD CONSTRAINT copa_palpites_profiles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;
