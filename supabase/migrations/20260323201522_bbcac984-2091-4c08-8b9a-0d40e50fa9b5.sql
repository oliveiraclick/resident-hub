-- Add slug column to lojas
ALTER TABLE public.lojas ADD COLUMN slug text;

-- Create unique index for slug
CREATE UNIQUE INDEX lojas_slug_unique ON public.lojas (slug) WHERE slug IS NOT NULL;

-- Generate slugs for existing lojas
UPDATE public.lojas SET slug = lower(
  regexp_replace(
    regexp_replace(
      translate(nome, 'áàãâéèêíìîóòõôúùûçÁÀÃÂÉÈÊÍÌÎÓÒÕÔÚÙÛÇ', 'aaaaeeeiiioooouuucAAAAEEEIIIOOOOUUUC'),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
) || '-' || substr(id::text, 1, 4);

-- Allow public (anon) to read active lojas by slug
CREATE POLICY "Public can view active lojas by slug"
ON public.lojas
FOR SELECT
TO anon
USING (ativa = true AND slug IS NOT NULL);
