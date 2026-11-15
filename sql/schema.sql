-- Esquema para Supabase (PostgreSQL). Carga: country_years_clean.csv -> countries + observations.
create table countries (
  country_key text primary key,
  name        text not null,
  region      text not null
);

create table observations (
  id bigint generated always as identity primary key,
  country_key text not null references countries(country_key),
  year        smallint not null check (year between 2015 and 2024),
  rank_source smallint, rank_recalc smallint, score numeric(6,4) not null,
  gdp numeric(8,5), gdp_valid numeric(8,5), gdp_z numeric(8,5),
  social numeric(6,5), hle numeric(5,1), hle_norm numeric(6,5),
  freedom numeric(6,5), generosity numeric(6,5), corruption numeric(6,5),
  corruption_inverted boolean not null default false,
  region_changed boolean not null default false,
  rank_inconsistent boolean not null default false,
  outlier_flags text,
  unique (country_key, year)
);
create index on observations (year);
