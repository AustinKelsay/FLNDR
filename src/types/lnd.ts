export interface LndConnectionConfig {
  baseUrl: string;
  macaroon: string;
  tlsCert?: string;
  network?: BitcoinNetwork;
}

export type BitcoinNetwork = 'mainnet' | 'regtest' | 'signet';

export interface GetInfoResponse {
  version: string;
  commit_hash: string;
  identity_pubkey: string;
  alias: string;
  color: string;
  num_pending_channels: number;
  num_active_channels: number;
  num_inactive_channels: number;
  num_peers: number;
  block_height: number;
  block_hash: string;
  best_header_timestamp: string;
  synced_to_chain: boolean;
  synced_to_graph: boolean;
  chains: Array<{
    chain: string;
    network: string;
  }>;
  uris: string[];
  features: {
    [key: string]: {
      name: string;
      is_required: boolean;
      is_known: boolean;
    };
  };
} 

export interface ChannelBalanceResponse {
  balance: string;
  pending_open_balance: string;
  local_balance: {
    sat: string;
    msat: string;
  };
  remote_balance: {
    sat: string;
    msat: string;
  };
  unsettled_local_balance: {
    sat: string;
    msat: string;
  };
  unsettled_remote_balance: {
    sat: string;
    msat: string;
  };
  pending_open_local_balance: {
    sat: string;
    msat: string;
  };
  pending_open_remote_balance: {
    sat: string;
    msat: string;
  };
}

export interface AddInvoiceRequest {
  memo?: string;
  value?: string;
  value_msat?: string;
  description_hash?: string;
  expiry?: string;
  fallback_addr?: string;
  cltv_expiry?: string;
  private?: boolean;
  add_index?: string;
  settle_index?: string;
}

export interface AddInvoiceResponse {
  r_hash: string;
  payment_request: string;
  add_index: string;
  payment_addr: string;
}

export interface LookupInvoiceRequest {
  r_hash_str: string;
}

export interface Invoice {
  memo: string;
  r_preimage: string;
  r_hash: string;
  value: string;
  value_msat: string;
  settled: boolean;
  creation_date: string;
  settle_date: string;
  payment_request: string;
  description_hash: string;
  expiry: string;
  fallback_addr: string;
  cltv_expiry: string;
  route_hints: Array<any>;
  private: boolean;
  add_index: string;
  settle_index: string;
  amt_paid: string;
  amt_paid_sat: string;
  amt_paid_msat: string;
  state: 'OPEN' | 'SETTLED' | 'CANCELED' | 'ACCEPTED';
  htlcs: Array<{
    chan_id: string;
    htlc_index: string;
    amt_msat: string;
    accept_height: number;
    accept_time: string;
    resolve_time: string;
    expiry_height: number;
    state: string;
    custom_records: Record<string, string>;
    mpp_total_amt_msat: string;
  }>;
  features: Record<string, {
    name: string;
    is_required: boolean;
    is_known: boolean;
  }>;
  is_keysend: boolean;
  payment_addr: string;
  is_amp: boolean;
}

export interface ListInvoicesRequest {
  pending_only?: boolean;
  index_offset?: string;
  num_max_invoices?: number;
  reversed?: boolean;
  creation_date_start?: string;
  creation_date_end?: string;
}

export interface ListInvoicesResponse {
  invoices: Invoice[];
  last_index_offset: string;
  first_index_offset: string;
}

export interface ListPaymentsRequest {
  include_incomplete?: boolean;
  index_offset?: string;
  max_payments?: number;
  reversed?: boolean;
  count_total_payments?: boolean;
  creation_date_start?: string;
  creation_date_end?: string;
}

export interface Payment {
  payment_hash: string;
  value: string;
  creation_date: string;
  fee: string;
  payment_preimage: string;
  value_sat: string;
  value_msat: string;
  payment_request: string;
  status: 'UNKNOWN' | 'IN_FLIGHT' | 'SUCCEEDED' | 'FAILED';
  fee_sat: string;
  fee_msat: string;
  creation_time_ns: string;
  htlcs: Array<{
    status: string;
    route: {
      hops: Array<{
        chan_id: string;
        chan_capacity: string;
        amt_to_forward: string;
        fee: string;
        expiry: number;
        amt_to_forward_msat: string;
        fee_msat: string;
        pub_key: string;
      }>;
      total_time_lock: number;
      total_fees: string;
      total_amt: string;
      total_fees_msat: string;
      total_amt_msat: string;
    };
    attempt_time_ns: string;
    resolve_time_ns: string;
    failure?: {
      code: string;
      channel_update: any;
      htlc_msat: string;
      onion_sha_256: string;
      cltv_expiry: string;
      flags: number;
      failure_source_index: number;
      height: number;
    };
    preimage: string;
  }>;
  path: string[];
  failure_reason: 'FAILURE_REASON_NONE' | 'FAILURE_REASON_TIMEOUT' | 'FAILURE_REASON_NO_ROUTE' | 'FAILURE_REASON_ERROR' | 'FAILURE_REASON_INCORRECT_PAYMENT_DETAILS' | 'FAILURE_REASON_INSUFFICIENT_BALANCE';
}

export interface ListPaymentsResponse {
  payments: Payment[];
  first_index_offset: string;
  last_index_offset: string;
  total_num_payments: string;
} 