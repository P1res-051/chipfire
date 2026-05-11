-- Criação idempotente do DB "evolution" (psql).
-- Obs: CREATE DATABASE não pode rodar dentro de DO $$ ... $$ (transação).
SELECT 'CREATE DATABASE evolution'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'evolution')\gexec
