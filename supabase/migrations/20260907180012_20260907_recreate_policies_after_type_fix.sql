-- Step 3: Recreate all RLS policies

-- orders policies
CREATE POLICY "orders_select_own_admin"
ON public.orders FOR SELECT
TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "orders_insert_self_admin"
ON public.orders FOR INSERT
TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "orders_update_admin"
ON public.orders FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "orders_delete_admin"
ON public.orders FOR DELETE
TO authenticated USING (public.is_admin());

-- enrollments policies
CREATE POLICY "enrollments_select_own_admin"
ON public.enrollments FOR SELECT
TO authenticated USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "enrollments_insert_self_admin"
ON public.enrollments FOR INSERT
TO authenticated WITH CHECK (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "enrollments_update_admin"
ON public.enrollments FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "enrollments_delete_admin"
ON public.enrollments FOR DELETE
TO authenticated USING (public.is_admin());

-- digital_access policies
CREATE POLICY "digital_access_select_own_admin"
ON public.digital_access FOR SELECT
TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "digital_access_insert_admin"
ON public.digital_access FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "digital_access_update_admin"
ON public.digital_access FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "digital_access_delete_admin"
ON public.digital_access FOR DELETE
TO authenticated USING (public.is_admin());

-- invoices policies
CREATE POLICY "invoices_select_own_admin"
ON public.invoices FOR SELECT
TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "invoices_insert_self_admin"
ON public.invoices FOR INSERT
TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "invoices_update_admin"
ON public.invoices FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "invoices_delete_admin"
ON public.invoices FOR DELETE
TO authenticated USING (public.is_admin());

-- order_items policies
CREATE POLICY "order_items_select_own_admin"
ON public.order_items FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND (orders.user_id = auth.uid() OR public.is_admin())));

CREATE POLICY "order_items_insert_admin"
ON public.order_items FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "order_items_delete_admin"
ON public.order_items FOR DELETE
TO authenticated USING (public.is_admin());