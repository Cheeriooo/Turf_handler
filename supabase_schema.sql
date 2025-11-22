-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);

-- Function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- MATCHES
create table matches (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  team1_name text not null,
  team2_name text not null,
  total_overs integer not null,
  winner_team text, -- 'team1', 'team2', or 'tie'
  match_date timestamp with time zone default now(),
  is_completed boolean default false,
  final_score_team1 integer,
  final_score_team2 integer,
  final_wickets_team1 integer,
  final_wickets_team2 integer,
  created_at timestamp with time zone default now()
);

-- INNINGS
create table innings (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references matches(id) on delete cascade not null,
  innings_number integer not null, -- 1 or 2
  batting_team text not null,
  total_runs integer default 0,
  total_wickets integer default 0,
  overs_played numeric default 0
);

-- OVERS
create table overs (
  id uuid default uuid_generate_v4() primary key,
  innings_id uuid references innings(id) on delete cascade not null,
  over_number integer not null,
  bowler_name text,
  runs_conceded integer default 0,
  wickets_taken integer default 0
);

-- BALLS
create table balls (
  id uuid default uuid_generate_v4() primary key,
  over_id uuid references overs(id) on delete cascade not null,
  ball_number integer not null,
  striker_name text,
  non_striker_name text,
  runs integer default 0,
  is_extra boolean default false,
  extra_type text, -- 'Wide', 'No Ball', etc.
  is_wicket boolean default false,
  wicket_type text -- 'Bowled', 'Caught', etc.
);

-- RLS POLICIES (Row Level Security)
alter table profiles enable row level security;
alter table matches enable row level security;
alter table innings enable row level security;
alter table overs enable row level security;
alter table balls enable row level security;

-- Allow users to view and edit their own data
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

create policy "Users can view own matches." on matches for select using ( auth.uid() = user_id );
create policy "Users can insert own matches." on matches for insert with check ( auth.uid() = user_id );
create policy "Users can update own matches." on matches for update using ( auth.uid() = user_id );

-- (Simplified policies for child tables - assuming if you can see match, you can see details)
create policy "Users can view innings of own matches." on innings for select using ( exists ( select 1 from matches where matches.id = innings.match_id and matches.user_id = auth.uid() ) );
create policy "Users can insert innings of own matches." on innings for insert with check ( exists ( select 1 from matches where matches.id = match_id and matches.user_id = auth.uid() ) );

create policy "Users can view overs of own matches." on overs for select using ( exists ( select 1 from innings join matches on matches.id = innings.match_id where innings.id = overs.innings_id and matches.user_id = auth.uid() ) );
create policy "Users can insert overs of own matches." on overs for insert with check ( exists ( select 1 from innings join matches on matches.id = innings.match_id where innings.id = innings_id and matches.user_id = auth.uid() ) );

create policy "Users can view balls of own matches." on balls for select using ( exists ( select 1 from overs join innings on innings.id = overs.innings_id join matches on matches.id = innings.match_id where overs.id = balls.over_id and matches.user_id = auth.uid() ) );
create policy "Users can insert balls of own matches." on balls for insert with check ( exists ( select 1 from overs join innings on innings.id = overs.innings_id join matches on matches.id = innings.match_id where overs.id = over_id and matches.user_id = auth.uid() ) );
