-- Allow public users to insert their stitching customizations
CREATE POLICY "Allow public users to insert customizations"
ON public.stitching_customizations FOR INSERT
WITH CHECK (true);
