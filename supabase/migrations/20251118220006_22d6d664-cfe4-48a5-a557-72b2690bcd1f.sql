-- Fix security warnings by setting search_path for all functions

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update calculate_invoice_total function
CREATE OR REPLACE FUNCTION public.calculate_invoice_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.total = NEW.base_amount + NEW.vat_amount;
  RETURN NEW;
END;
$$;

-- Update update_credit_recognized function
CREATE OR REPLACE FUNCTION public.update_credit_recognized()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.credits
  SET credit_recognized_o = (
    SELECT COALESCE(SUM(total), 0)
    FROM public.invoices
    WHERE credit_id = COALESCE(NEW.credit_id, OLD.credit_id)
  ),
  credit_real = credit_committed_d - (
    SELECT COALESCE(SUM(total), 0)
    FROM public.invoices
    WHERE credit_id = COALESCE(NEW.credit_id, OLD.credit_id)
  )
  WHERE id = COALESCE(NEW.credit_id, OLD.credit_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update update_credit_real function
CREATE OR REPLACE FUNCTION public.update_credit_real()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.credit_real = NEW.credit_committed_d - NEW.credit_recognized_o;
  RETURN NEW;
END;
$$;