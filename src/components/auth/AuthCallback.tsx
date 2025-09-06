useEffect(() => {
  const run = async () => {
    try {
      // 0) If we ALREADY have a session, just continue (no need for tokens)
      const { data: s0 } = await supabase.auth.getSession();
      const session0 = s0.session;
      const url = new URL(window.location.href);
      const nextParam = url.searchParams.get("next");
      const next = nextParam && nextParam.startsWith("/") ? nextParam : "/complete-account";

      if (session0) {
        // Clean URL then go forward
        url.hash = "";
        url.search = nextParam ? `?next=${encodeURIComponent(nextParam)}` : "";
        window.history.replaceState({}, document.title, url.toString());
        navigate(next, { replace: true });
        return;
      }

      // 1) No session → try to create one from URL tokens
      const hasCode = url.searchParams.get("code");
      const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
      const hp = new URLSearchParams(hash);
      const accessToken = hp.get("access_token");
      const refreshToken = hp.get("refresh_token");

      let establishErr: string | null = null;

      if (hasCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(url.searchParams.get("code")!);
        if (error) establishErr = error.message;
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) establishErr = error.message;
      } else {
        establishErr = "Missing auth parameters.";
      }

      // 2) If token flow failed, check again: maybe session was created anyway
      const { data: s1 } = await supabase.auth.getSession();
      if (s1.session) {
        url.hash = "";
        url.search = nextParam ? `?next=${encodeURIComponent(nextParam)}` : "";
        window.history.replaceState({}, document.title, url.toString());
        navigate(next, { replace: true });
        return;
      }

      if (establishErr) {
        navigate("/auth/error", { replace: true });
        return;
      }

      // 3) Success → clean URL and continue
      url.hash = "";
      url.search = nextParam ? `?next=${encodeURIComponent(nextParam)}` : "";
      window.history.replaceState({}, document.title, url.toString());
      navigate(next, { replace: true });
    } catch {
      navigate("/auth/error", { replace: true });
    }
  };

  run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);