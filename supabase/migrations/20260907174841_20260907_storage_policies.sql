-- Storage policies for the 'uploads' bucket
-- Allow authenticated users to upload files
-- Allow public to read files (thumbnails, preview videos, payment proofs are public)

CREATE POLICY "uploads_read_public"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'uploads');

CREATE POLICY "uploads_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "uploads_update_owner"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads' AND owner = auth.uid())
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "uploads_delete_owner"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads' AND owner = auth.uid());