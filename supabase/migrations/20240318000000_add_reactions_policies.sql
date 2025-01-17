-- Enable RLS on reactions table
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read reactions
CREATE POLICY "Allow authenticated users to read reactions" ON public.reactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow authenticated users to add reactions
CREATE POLICY "Allow authenticated users to add reactions" ON public.reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own reactions
CREATE POLICY "Allow users to delete their own reactions" ON public.reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id); 