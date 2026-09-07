ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_payment_transaction_id uuid;

CREATE TABLE payment_transactions (
    id uuid PRIMARY KEY,
    owner_account_id uuid NOT NULL,
    owner_profile_id uuid NOT NULL,
    product_code varchar(80) NOT NULL,
    entitlement_type varchar(32) NOT NULL,
    entitlement_quantity integer NOT NULL,
    provider varchar(40) NOT NULL,
    provider_transaction_id varchar(180),
    provider_checkout_id varchar(180),
    amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
    currency varchar(3) NOT NULL,
    status varchar(32) NOT NULL,
    last_provider_event_at timestamp(6) with time zone,
    entitlement_granted_at timestamp(6) with time zone,
    refunded_at timestamp(6) with time zone,
    chargeback_at timestamp(6) with time zone,
    response_count_at_grant integer,
    reversal_status varchar(32) NOT NULL DEFAULT 'NONE',
    version bigint,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    CONSTRAINT uk_payment_provider_transaction UNIQUE (provider, provider_transaction_id),
    CONSTRAINT uk_payment_provider_checkout UNIQUE (provider, provider_checkout_id)
);

CREATE INDEX idx_payment_owner_created ON payment_transactions(owner_account_id, created_at);
CREATE INDEX idx_payment_status ON payment_transactions(status);

CREATE TABLE payment_provider_events (
    id uuid PRIMARY KEY,
    provider varchar(40) NOT NULL,
    provider_event_id varchar(180) NOT NULL,
    payment_transaction_id uuid NOT NULL REFERENCES payment_transactions(id),
    event_type varchar(40) NOT NULL,
    outcome varchar(32) NOT NULL,
    payload_digest varchar(64) NOT NULL,
    provider_occurred_at timestamp(6) with time zone NOT NULL,
    processed_at timestamp(6) with time zone NOT NULL,
    CONSTRAINT uk_payment_provider_event UNIQUE (provider, provider_event_id)
);

CREATE INDEX idx_payment_event_transaction ON payment_provider_events(payment_transaction_id);
