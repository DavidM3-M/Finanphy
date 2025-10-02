import { AppDataSource } from './data-source';

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Conexión establecida con Supabase');
    return AppDataSource.runMigrations();
  })
  .then(() => {
    console.log('✅ Migraciones ejecutadas correctamente');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error durante migración:', err);
    process.exit(1);
  });