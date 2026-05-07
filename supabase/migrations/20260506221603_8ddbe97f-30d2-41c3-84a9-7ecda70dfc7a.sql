
CREATE TABLE public.recap_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_token uuid NOT NULL UNIQUE,
  email text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cloud_snapshots (
  device_token uuid PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recap_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_snapshots ENABLE ROW LEVEL SECURITY;

-- Deny all by default; edge functions use service role to bypass RLS
-- (no policies created => no anon/authenticated access)

CREATE INDEX idx_recap_subscribers_enabled ON public.recap_subscribers(enabled) WHERE enabled = true;
