-- Create a table for global app configurations
CREATE TABLE public.app_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB DEFAULT '{}'::jsonb,
    enabled BOOLEAN DEFAULT false,
    start_at TIMESTAMP WITH TIME ZONE,
    end_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant permissions
GRANT SELECT ON public.app_configs TO anon, authenticated;
GRANT ALL ON public.app_configs TO service_role;

-- Enable RLS
ALTER TABLE public.app_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view app configs" 
ON public.app_configs FOR SELECT 
USING (true);

-- Fixed to use platform_admin role
CREATE POLICY "Only platform admins can update app configs" 
ON public.app_configs FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'platform_admin'
    )
);

-- Initial seed for World Cup theme
INSERT INTO public.app_configs (key, enabled) 
VALUES ('theme_world_cup', false)
ON CONFLICT (key) DO NOTHING;

-- Create function to update timestamps if it doesn't exist (it usually does in this project)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_app_configs_updated_at ON public.app_configs;
CREATE TRIGGER update_app_configs_updated_at
BEFORE UPDATE ON public.app_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();