@@ .. @@
 -- Function to clean expired sessions
 CREATE OR REPLACE FUNCTION public.clean_expired_sessions()
 RETURNS void AS $$
 BEGIN
     DELETE FROM public.user_sessions WHERE expires_at < NOW();
 END;
 $$ language 'plpgsql';
 
+-- Function to check if current user is admin (SECURITY DEFINER to bypass RLS)
+CREATE OR REPLACE FUNCTION public.is_admin()
+RETURNS boolean AS $$
+BEGIN
+    RETURN EXISTS (
+        SELECT 1 FROM public.users 
+        WHERE auth_user_id = auth.uid() 
+        AND role = 'administrador'
+    );
+END;
+$$ language 'plpgsql' SECURITY DEFINER;
+
+-- Function to check if current user is staff (SECURITY DEFINER to bypass RLS)
+CREATE OR REPLACE FUNCTION public.is_staff()
+RETURNS boolean AS $$
+BEGIN
+    RETURN EXISTS (
+        SELECT 1 FROM public.users 
+        WHERE auth_user_id = auth.uid() 
+        AND role IN ('despachante', 'administrador')
+    );
+END;
+$$ language 'plpgsql' SECURITY DEFINER;
+
 -- Enable Row Level Security (RLS)
 ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
@@ .. @@
 CREATE POLICY "Users can view their own profile" ON public.users
     FOR SELECT USING (auth.uid() = auth_user_id);
 
 CREATE POLICY "Admins can view all users" ON public.users
-    FOR SELECT USING (
-        EXISTS (
-            SELECT 1 FROM public.users 
-            WHERE auth_user_id = auth.uid() 
-            AND role = 'administrador'
-        )
-    );
+    FOR SELECT USING (public.is_admin());
 
 CREATE POLICY "Admins can insert users" ON public.users
-    FOR INSERT WITH CHECK (
-        EXISTS (
-            SELECT 1 FROM public.users 
-            WHERE auth_user_id = auth.uid() 
-            AND role = 'administrador'
-        )
-    );
+    FOR INSERT WITH CHECK (public.is_admin());
 
 CREATE POLICY "Admins can update users" ON public.users
-    FOR UPDATE USING (
-        EXISTS (
-            SELECT 1 FROM public.users 
-            WHERE auth_user_id = auth.uid() 
-            AND role = 'administrador'
-        )
-    );
+    FOR UPDATE USING (public.is_admin());
 
 -- RLS Policies for materials table
 CREATE POLICY "Authenticated users can view materials" ON public.materials
     FOR SELECT USING (auth.role() = 'authenticated');
 
 CREATE POLICY "Staff can manage materials" ON public.materials
-    FOR ALL USING (
-        EXISTS (
-            SELECT 1 FROM public.users 
-            WHERE auth_user_id = auth.uid() 
-            AND role IN ('despachante', 'administrador')
-        )
-    );
+    FOR ALL USING (public.is_staff());
 
 -- RLS Policies for suppliers table
 CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
     FOR SELECT USING (auth.role() = 'authenticated');
 
 CREATE POLICY "Staff can manage suppliers" ON public.suppliers
-    FOR ALL USING (
-        EXISTS (
-            SELECT 1 FROM public.users 
-            WHERE auth_user_id = auth.uid() 
-            AND role IN ('despachante', 'administrador')
-        )
-    );
+    FOR ALL USING (public.is_staff());
 
 -- RLS Policies for requests table
 CREATE POLICY "Users can view their own requests" ON public.requests
@@ .. @@
     );
 
 CREATE POLICY "Staff can view all requests" ON public.requests
-    FOR SELECT USING (
-        EXISTS (
-            SELECT 1 FROM public.users 
-            WHERE auth_user_id = auth.uid() 
-            AND role IN ('despachante', 'administrador')
-        )
-    );
+    FOR SELECT USING (public.is_staff());
 
 CREATE POLICY "Users can create requests" ON public.requests
     FOR INSERT WITH CHECK (
@@ .. @@
     );
 
 CREATE POLICY "Staff can update requests" ON public.requests
-    FOR UPDATE USING (
-        EXISTS (
-            SELECT 1 FROM public.users 
-            WHERE auth_user_id = auth.uid() 
-            AND role IN ('despachante', 'administrador')
-        )
-    );
+    FOR UPDATE USING (public.is_staff());
 
 -- RLS Policies for request_items table
 CREATE POLICY "Users can view items from their requests" ON public.request_items
@@ .. @@
     );
 
 CREATE POLICY "Staff can view all request items" ON public.request_items
-    FOR SELECT USING (
-        EXISTS (
-            SELECT 1 FROM public.users 
-            WHERE auth_user_id = auth.uid() 
-            AND role IN ('despachante', 'administrador')
-        )
-    );
+    FOR SELECT USING (public.is_staff());
 
 CREATE POLICY "Users can manage items from their pending requests" ON public.request_items
     FOR ALL USING (
@@ .. @@
     );
 
 CREATE POLICY "Staff can manage all request items" ON public.request_items
-    FOR ALL USING (
-        EXISTS (
-            SELECT 1 FROM public.users 
-            WHERE auth_user_id = auth.uid() 
-            AND role IN ('despachante', 'administrador')
-        )
-    );
+    FOR ALL USING (public.is_staff());
 
 -- RLS Policies for stock_entries table
 CREATE POLICY "Staff can view stock entries" ON public.stock_entries
-    FOR SELECT USING (
-        EXISTS (
-            SELECT 1 FROM public.users 
-            WHERE auth_user_id = auth.uid() 
-            AND role IN ('despachante', 'administrador')
-        )
-    );
+    FOR SELECT USING (public.is_staff());
 
 CREATE POLICY "Staff can create stock entries" ON public.stock_entries
-    FOR INSERT WITH CHECK (
-        EXISTS (
-            SELECT 1 FROM public.users 
-            WHERE auth_user_id = auth.uid() 
-            AND role IN ('despachante', 'administrador')
-        )
-    );
+    FOR INSERT WITH CHECK (public.is_staff());
 
 -- RLS Policies for stock_movements table
 CREATE POLICY "Staff can view stock movements" ON public.stock_movements
-    FOR SELECT USING (
-        EXISTS (
-            SELECT 1 FROM public.users 
-            WHERE auth_user_id = auth.uid() 
-            AND role IN ('despachante', 'administrador')
-        )
-    );
+    FOR SELECT USING (public.is_staff());
 
 -- RLS Policies for user_sessions table
 CREATE POLICY "Users can manage their own sessions" ON public.user_sessions