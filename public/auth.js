(() => {
  window.AuthReady = (async () => {
    const config = window.SUPABASE_CONFIG;
    if (!config?.supabaseUrl || !config?.supabaseKey) {
      throw new Error('Falta configurar la conexión con Supabase.');
    }
    if (!window.supabase?.createClient) {
      throw new Error('No se pudo cargar el cliente de Supabase.');
    }

    const client = window.supabase.createClient(
      config.supabaseUrl,
      config.supabaseKey
    );

    return Object.freeze({
      signUp(email, password) {
        return client.auth.signUp({ email, password });
      },
      signIn(email, password) {
        return client.auth.signInWithPassword({ email, password });
      },
      signOut() {
        return client.auth.signOut();
      },
      getSession() {
        return client.auth.getSession();
      },
      onAuthStateChange(callback) {
        return client.auth.onAuthStateChange(callback);
      },
      async accessToken() {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        return data.session?.access_token || null;
      }
    });
  })();
})();
