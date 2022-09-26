/* eslint-disable @typescript-eslint/ban-types */
export interface TimeEntry {
  id: string;
  administration_id: string;
  contact_id: string;
  project_id: string;
  user_id: string;
  started_at: Date;
  ended_at: Date;
  description: string;
  paused_duration: number;
  billable: boolean;
  created_at: Date;
  updated_at: Date;
  contact: {};
  detail: null;
  user: {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
  };
  project: {
    id: string;
    name: string;
    state: 'archived';
  };
  events: {}[];
  notes: {}[];
}

export interface FinancialMutation {
  amount: string;
  currency: 'USD' | 'EUR';
  exchange_rate: string;
  ledger_account_bookings: {
    ledger_account_id: string;
    price: string;
  }[];
}

export interface GeneralJournalDocument {
  general_journal_document_entries: {
    ledger_account_id: string;
    debit: string;
    credit: string;
  }[];
}

export interface PurchaseInvoice {
  state: 'open' | 'new' | 'paid';
  total_price_excl_tax: string;
  currency: 'USD' | 'EUR';
  exchange_rate: string;
  details: {
    ledger_account_id: string;
    price: string;
    total_price_excl_tax_with_discount?: string;
    total_price_excl_tax_with_discount_base?: string;
  }[];
  payments: {
    ledger_account_id: string;
    price: string;
    price_base?: string;
  }[];
}

export interface Receipt {
  total_price_excl_tax: string;
  currency: 'USD' | 'EUR';
  exchange_rate: string;
  details: {
    ledger_account_id: string;
    price: string;
    total_price_excl_tax_with_discount?: string;
    total_price_excl_tax_with_discount_base?: string;
  }[];
  payments: { ledger_account_id: string; price: string }[];
}

export interface SalesInvoice {
  state:
    | 'pending_payment'
    | 'paid'
    | 'open'
    | 'late'
    | 'scheduled'
    | 'reminded';
  total_price_excl_tax: string;
  contact: {
    id: string;
    company_name: string;
    custom_fields: { id: string; name: string; value: string }[];
  };
}

export interface Contact {
  id: string;
  company_name: string;
  custom_fields: { id: string; name: string; value: string }[];
}
