-- Tabla para guardar ubicaciones personalizadas (hoteles, fincas, comunidades, etc.)
create table if not exists ubicaciones_personalizadas (
  id bigint primary key generated always as identity,
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  direccion text not null default '',
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);

-- Permitir lectura/escritura desde el cliente
alter table ubicaciones_personalizadas enable row level security;

create policy "Lectura para usuarios autenticados"
  on ubicaciones_personalizadas for select
  using (true);

create policy "Insercion para usuarios autenticados"
  on ubicaciones_personalizadas for insert
  with check (true);

create policy "Eliminacion para usuarios autenticados"
  on ubicaciones_personalizadas for delete
  using (true);
