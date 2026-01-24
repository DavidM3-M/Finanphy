import { AppDataSource } from 'src/data-source';

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Conexión exitosa a Supabase');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error de conexión:', err);
    process.exit(1);
  });
