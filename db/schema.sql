-- Structure OS storage — approvals + agent event log.
-- Run this once in the Supabase SQL editor. Everything the agents produce
-- lands here; the Agent Console reads from these tables.
--
-- REQUIRED env vars on Vercel:
--   SUPABASE_URL           = https://<project>.supabase.co
--   SUPABASE_SERVICE_KEY   = <service-role key from Supabase Settings → API>
--
-- Service-role key is used because the Vercel functions run server-side and
-- bypass RLS deliberately. Do NOT expose the service key to the browser.

create table if not exists agent_approvals (
  id             uuid primary key default gen_random_uuid(),
  agent_id       text not null,          -- e.g. 'sales', 'finance'
  dept_label     text not null,          -- 'Sales', 'Finance'
  risk           text not null check (risk in ('low','med','high')),
  ctx            text not null,          -- one-line context ("Client X · 9 days overdue")
  rec            text not null,          -- one-line recommendation ("Dispatch Retell billing agent...")
  action         jsonb not null,         -- { type: 'send_email' | 'meta_update_adset' | ..., params: {...} }
  status         text not null default 'pending' check (status in ('pending','approved','rejected','done','failed')),
  created_at     timestamptz not null default now(),
  acted_at       timestamptz,            -- when the owner approved/rejected
  executed_at    timestamptz,            -- when the action ran
  result         jsonb,                  -- action's return value or error
  agent_run_id   text                    -- ties an approval back to a specific agent run
);
create index if not exists agent_approvals_pending_idx on agent_approvals (status, created_at desc);
create index if not exists agent_approvals_agent_idx on agent_approvals (agent_id, created_at desc);

create table if not exists agent_events (
  id             uuid primary key default gen_random_uuid(),
  agent_id       text not null,          -- 'sales', 'finance', 'orchestrator', ...
  ts             timestamptz not null default now(),
  msg            text not null,          -- one-line human-readable
  level          text not null default 'info' check (level in ('info','warn','error')),
  agent_run_id   text,                   -- groups all events from a single agent invocation
  detail         jsonb                   -- optional structured detail
);
create index if not exists agent_events_recent_idx on agent_events (ts desc);
create index if not exists agent_events_agent_recent_idx on agent_events (agent_id, ts desc);
