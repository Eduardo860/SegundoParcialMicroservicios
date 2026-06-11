-- =====================================================
-- PostgreSQL Init Script - Retry Jobs Database
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PRODUCTS RETRY JOBS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products_retry_jobs (
    id          uuid DEFAULT uuid_generate_v4() NOT NULL,
    product_id  varchar                          NOT NULL,
    request_data  text                           NULL,
    response_data text                           NULL,
    action      varchar                          NOT NULL,
    attempt     int4    NOT NULL DEFAULT 0,
    status      varchar NOT NULL DEFAULT 'SCHEDULED',
    next_run_at timestamptz DEFAULT now()        NOT NULL,
    created_at  timestamptz DEFAULT now()        NOT NULL,
    updated_at  timestamptz DEFAULT now()        NOT NULL,
    CONSTRAINT pk_products_retry_jobs PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_products_retry_product_id
    ON public.products_retry_jobs (product_id);

CREATE INDEX IF NOT EXISTS idx_products_retry_status
    ON public.products_retry_jobs (status);

CREATE INDEX IF NOT EXISTS idx_products_retry_next_run_status
    ON public.products_retry_jobs (next_run_at, status)
    WHERE status = 'SCHEDULED';

CREATE INDEX IF NOT EXISTS idx_products_retry_unique_action
    ON public.products_retry_jobs (product_id, action);

-- =====================================================
-- ORDER RETRY JOBS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_retry_jobs (
    id         uuid DEFAULT uuid_generate_v4() NOT NULL,
    order_id   varchar                         NOT NULL,
    request_data  text                         NULL,
    response_data text                         NULL,
    action     varchar                         NOT NULL,
    attempt    int4    NOT NULL DEFAULT 0,
    status     varchar NOT NULL DEFAULT 'SCHEDULED',
    next_run_at timestamptz DEFAULT now()      NOT NULL,
    created_at  timestamptz DEFAULT now()      NOT NULL,
    updated_at  timestamptz DEFAULT now()      NOT NULL,
    CONSTRAINT pk_order_retry_jobs PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_order_retry_order_id
    ON public.order_retry_jobs (order_id);

CREATE INDEX IF NOT EXISTS idx_order_retry_status
    ON public.order_retry_jobs (status);

CREATE INDEX IF NOT EXISTS idx_order_retry_next_run_status
    ON public.order_retry_jobs (next_run_at, status)
    WHERE status = 'SCHEDULED';

CREATE INDEX IF NOT EXISTS idx_order_retry_unique_action
    ON public.order_retry_jobs (order_id, action);

-- =====================================================
-- PAYMENTS RETRY JOBS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments_retry_jobs (
    id         uuid DEFAULT uuid_generate_v4() NOT NULL,
    payment_id varchar                         NOT NULL,
    request_data  text                         NULL,
    response_data text                         NULL,
    action     varchar                         NOT NULL,
    attempt    int4    NOT NULL DEFAULT 0,
    status     varchar NOT NULL DEFAULT 'SCHEDULED',
    next_run_at timestamptz DEFAULT now()      NOT NULL,
    created_at  timestamptz DEFAULT now()      NOT NULL,
    updated_at  timestamptz DEFAULT now()      NOT NULL,
    CONSTRAINT pk_payments_retry_jobs PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_payments_retry_payment_id
    ON public.payments_retry_jobs (payment_id);

CREATE INDEX IF NOT EXISTS idx_payments_retry_status
    ON public.payments_retry_jobs (status);

CREATE INDEX IF NOT EXISTS idx_payments_retry_next_run_status
    ON public.payments_retry_jobs (next_run_at, status)
    WHERE status = 'SCHEDULED';

CREATE INDEX IF NOT EXISTS idx_payments_retry_unique_action
    ON public.payments_retry_jobs (payment_id, action);

-- =====================================================
-- ENVIOS (SHIPPING/EMAIL SENDING)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.envios (
    id              uuid DEFAULT uuid_generate_v4() NOT NULL,
    order_id        varchar                          NOT NULL UNIQUE,
    customer_email  varchar(255)                     NOT NULL,
    status          varchar(20) NOT NULL DEFAULT 'SCHEDULED',
    scheduled_at    timestamptz DEFAULT now()        NOT NULL,
    next_run_at     timestamptz DEFAULT now()        NOT NULL,
    sent_at         timestamptz                      NULL,
    attempt         int4    NOT NULL DEFAULT 0,
    error_message   text                             NULL,
    created_at      timestamptz DEFAULT now()        NOT NULL,
    updated_at      timestamptz DEFAULT now()        NOT NULL,
    CONSTRAINT pk_envios PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_envios_order_id
    ON public.envios (order_id);

CREATE INDEX IF NOT EXISTS idx_envios_status
    ON public.envios (status);

CREATE INDEX IF NOT EXISTS idx_envios_next_run_status
    ON public.envios (next_run_at, status)
    WHERE status = 'SCHEDULED';

CREATE INDEX IF NOT EXISTS idx_envios_customer_email
    ON public.envios (customer_email);

-- =====================================================
-- ENVIOS RETRY JOBS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.envio_retry_jobs (
    id         uuid DEFAULT uuid_generate_v4() NOT NULL,
    envio_id   varchar                         NOT NULL,
    request_data  text                         NULL,
    response_data text                         NULL,
    action     varchar                         NOT NULL,
    attempt    int4    NOT NULL DEFAULT 0,
    status     varchar NOT NULL DEFAULT 'SCHEDULED',
    next_run_at timestamptz DEFAULT now()      NOT NULL,
    created_at  timestamptz DEFAULT now()      NOT NULL,
    updated_at  timestamptz DEFAULT now()      NOT NULL,
    CONSTRAINT pk_envio_retry_jobs PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_envio_retry_envio_id
    ON public.envio_retry_jobs (envio_id);

CREATE INDEX IF NOT EXISTS idx_envio_retry_status
    ON public.envio_retry_jobs (status);

CREATE INDEX IF NOT EXISTS idx_envio_retry_next_run_status
    ON public.envio_retry_jobs (next_run_at, status)
    WHERE status = 'SCHEDULED';

CREATE INDEX IF NOT EXISTS idx_envio_retry_unique_action
    ON public.envio_retry_jobs (envio_id, action);

-- =====================================================
-- RETRY JOBS (GENERAL)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.retry_jobs (
    id              uuid DEFAULT uuid_generate_v4() NOT NULL,
    service_type    varchar(50)                      NOT NULL,
    payload         jsonb                            NOT NULL,
    status          varchar(20) NOT NULL DEFAULT 'PENDING',
    retry_count     int4    NOT NULL DEFAULT 0,
    max_retries     int4    NOT NULL DEFAULT 5,
    last_error      varchar(500)                     NULL,
    next_run_at     timestamptz DEFAULT now()        NOT NULL,
    created_at      timestamptz DEFAULT now()        NOT NULL,
    updated_at      timestamptz DEFAULT now()        NOT NULL,
    CONSTRAINT pk_retry_jobs PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_retry_jobs_service_type
    ON public.retry_jobs (service_type);

CREATE INDEX IF NOT EXISTS idx_retry_jobs_status
    ON public.retry_jobs (status);

CREATE INDEX IF NOT EXISTS idx_retry_jobs_next_run_status
    ON public.retry_jobs (next_run_at, status)
    WHERE status IN ('PENDING', 'RETRY_SCHEDULED');

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_retry_jobs_updated_at BEFORE UPDATE ON public.products_retry_jobs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_order_retry_jobs_updated_at BEFORE UPDATE ON public.order_retry_jobs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_payments_retry_jobs_updated_at BEFORE UPDATE ON public.payments_retry_jobs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_envios_updated_at BEFORE UPDATE ON public.envios
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_envio_retry_jobs_updated_at BEFORE UPDATE ON public.envio_retry_jobs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_retry_jobs_updated_at BEFORE UPDATE ON public.retry_jobs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
