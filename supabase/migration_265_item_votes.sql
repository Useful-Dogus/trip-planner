-- #265 항목별 그룹 투표·선호 표시
-- 일행이 후보 선호를 가볍게 표시(멤버별 1항목 1투표). 집단 추리기 결정을 가시화.
-- RLS: 멤버는 같은 trip 투표 읽기, owner/editor 만 본인 투표 insert/delete(viewer 불가).
-- items 와 동일하게 trip_id 를 비정규화해 is_trip_member/user_role_in_trip 직접 적용.

create table if not exists public.item_votes (
  item_id    text        not null references public.items(id) on delete cascade,
  trip_id    uuid        not null references public.trips(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

create index if not exists idx_item_votes_trip on public.item_votes(trip_id);

alter table public.item_votes enable row level security;

drop policy if exists item_votes_select on public.item_votes;
create policy item_votes_select on public.item_votes
  for select using (public.is_trip_member(trip_id));

drop policy if exists item_votes_insert on public.item_votes;
create policy item_votes_insert on public.item_votes
  for insert with check (
    user_id = auth.uid() and public.user_role_in_trip(trip_id) in ('owner', 'editor')
  );

drop policy if exists item_votes_delete on public.item_votes;
create policy item_votes_delete on public.item_votes
  for delete using (
    user_id = auth.uid() and public.user_role_in_trip(trip_id) in ('owner', 'editor')
  );
