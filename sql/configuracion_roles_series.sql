-- Roles del sistema
create table if not exists roles (
  id bigint primary key generated always as identity,
  nombre text not null unique,
  descripcion text not null default '',
  permisos jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Usuarios del sistema (vinculados a auth.users de Supabase)
create table if not exists usuarios_sistema (
  id bigint primary key generated always as identity,
  auth_id uuid not null references auth.users(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  rol_id bigint not null references roles(id),
  nombre text not null,
  email text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table usuarios_sistema enable row level security;
create policy "Lectura para autenticados" on usuarios_sistema for select using (true);
create policy "Insercion para autenticados" on usuarios_sistema for insert with check (true);
create policy "Actualizacion para autenticados" on usuarios_sistema for update using (true);
create policy "Eliminacion para autenticados" on usuarios_sistema for delete using (true);

-- Insertar rol Super Admin por defecto
insert into roles (nombre, descripcion, permisos) values
  ('super_admin', 'Super Administrador — acceso total al sistema', '{"todo": true}')
on conflict (nombre) do nothing;

insert into roles (nombre, descripcion, permisos) values
  ('admin', 'Administrador — gestión operativa', '{"cotizaciones": true, "reservas": true, "flota": true, "clientes": true, "facturacion": true, "configuracion": false}')
on conflict (nombre) do nothing;

insert into roles (nombre, descripcion, permisos) values
  ('usuario', 'Usuario básico — solo lectura y operación', '{"cotizaciones": true, "reservas": true, "configuracion": false}')
on conflict (nombre) do nothing;

-- Agregar columnas de serie a empresas (si no existen)
alter table empresas add column if not exists serie_cotizaciones text not null default 'COT-000001';
alter table empresas add column if not exists serie_reservas text not null default 'RES-000001';
alter table empresas add column if not exists serie_facturas text not null default 'FEL-000001';
alter table empresas add column if not exists termino_pago_def text not null default '50% anticipo';
alter table empresas add column if not exists moneda_def text not null default 'GTQ';
alter table empresas add column if not exists pago_def text not null default 'efectivo';
alter table empresas add column if not exists eslogan text not null default '';
alter table empresas add column if not exists banco1 text not null default '';
alter table empresas add column if not exists banco2 text not null default '';
alter table empresas add column if not exists contacto text not null default '';
alter table empresas add column if not exists tel_contacto text not null default '';
alter table empresas add column if not exists email_contacto text not null default '';
alter table empresas add column if not exists web text not null default '';
alter table empresas add column if not exists firmante text not null default '';
alter table empresas add column if not exists tel_firmante text not null default '';
alter table empresas add column if not exists nota_pie text not null default '';
alter table empresas add column if not exists tasa_iva numeric not null default 5;
alter table empresas add column if not exists tasa_cambio numeric not null default 7.70;

-- Agregar campos de deducible a vehiculos
alter table vehiculos add column if not exists tipo_deducible text not null default '';
alter table vehiculos add column if not exists monto_deducible numeric not null default 0;
