CREATE TABLE public.meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  image_path text,
  eaten_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX meals_user_eaten_idx ON public.meals (user_id, eaten_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meals TO authenticated;
GRANT ALL ON public.meals TO service_role;

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own meals" ON public.meals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own meals" ON public.meals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own meals" ON public.meals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own meals" ON public.meals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users read own meal photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own meal photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own meal photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);