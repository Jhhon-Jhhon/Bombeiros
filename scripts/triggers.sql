-- ================================================================
-- TRIGGER 1 — Integridade
-- Bloqueia alocação de viatura já em atendimento
-- Nível: BEFORE INSERT em ocorrencia_viatura
-- Justificativa: garante a RN01 mesmo com acesso direto ao banco,
-- independente da validação da aplicação FastAPI
-- ================================================================
CREATE OR REPLACE FUNCTION fn_bloqueia_viatura_em_atendimento()
RETURNS TRIGGER AS $$
DECLARE
    v_status VARCHAR(50);
BEGIN
    SELECT status::VARCHAR INTO v_status
    FROM viatura
    WHERE id = NEW.viatura_id;

    IF v_status = 'em_atendimento' THEN
        RAISE EXCEPTION
            'REGRA RN01: Viatura id=% está em atendimento. '
            'Encerre a ocorrência atual antes de alocar novamente.',
            NEW.viatura_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bloqueia_viatura_em_atendimento ON ocorrencia_viatura;
CREATE TRIGGER trg_bloqueia_viatura_em_atendimento
    BEFORE INSERT ON ocorrencia_viatura
    FOR EACH ROW
    EXECUTE FUNCTION fn_bloqueia_viatura_em_atendimento();


-- ================================================================
-- TRIGGER 2 — Automação
-- Atualiza status da viatura para em_atendimento ao ser alocada
-- Nível: AFTER INSERT em ocorrencia_viatura
-- Justificativa: automação de estado — a aplicação não precisa
-- fazer dois updates separados; o banco mantém a consistência
-- ================================================================
CREATE OR REPLACE FUNCTION fn_atualiza_status_viatura()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE viatura
    SET status = 'em_atendimento'
    WHERE id = NEW.viatura_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atualiza_status_viatura ON ocorrencia_viatura;
CREATE TRIGGER trg_atualiza_status_viatura
    AFTER INSERT ON ocorrencia_viatura
    FOR EACH ROW
    EXECUTE FUNCTION fn_atualiza_status_viatura();


-- ================================================================
-- TRIGGER 3 — Automação
-- Libera viaturas e registra hora_fim ao encerrar ocorrência
-- Nível: AFTER UPDATE em ocorrencia
-- Justificativa: ao encerrar uma ocorrência, todas as viaturas
-- voltam automaticamente para disponivel sem intervenção manual
-- ================================================================
CREATE OR REPLACE FUNCTION fn_libera_viaturas_ao_encerrar()
RETURNS TRIGGER AS $$
BEGIN
    -- Só age quando status muda PARA 'encerrada'
    IF NEW.status = 'encerrada' AND OLD.status != 'encerrada' THEN

        -- Registra hora_fim nas alocações ainda abertas
        UPDATE ocorrencia_viatura
        SET hora_fim = NOW()
        WHERE ocorrencia_id = NEW.id
          AND hora_fim IS NULL;

        -- Libera todas as viaturas da ocorrência
        UPDATE viatura
        SET status = 'disponivel'
        WHERE id IN (
            SELECT viatura_id
            FROM ocorrencia_viatura
            WHERE ocorrencia_id = NEW.id
        );

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_libera_viaturas_ao_encerrar ON ocorrencia;
CREATE TRIGGER trg_libera_viaturas_ao_encerrar
    AFTER UPDATE ON ocorrencia
    FOR EACH ROW
    EXECUTE FUNCTION fn_libera_viaturas_ao_encerrar();