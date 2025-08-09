// src/components/auth/AuthContext.tsx
useEffect(() => {
  let mounted = true;

  const init = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const sess = data.session ?? null;
      setSession(sess);
      setUser(sess?.user ?? null);

      if (sess?.user) {
        await fetchProfile(sess.user.id);
      } else {
        setProfile(null);
      }
    } finally {
      // ensure we ALWAYS leave loading=false
      if (mounted) setLoading(false);
    }
  };

  init();

  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (_event, newSession) => {
      setSession(newSession ?? null);
      const nextUser = newSession?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        await fetchProfile(nextUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }
  );

  return () => {
    mounted = false;
    // 👇 make cleanup defensive
    authListener?.subscription?.unsubscribe?.();
  };
}, []);