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

/**
 * Request parameters for the v2 invoice lookup endpoint
 * Used with the /v2/invoices/lookup endpoint
 */
export interface LookupInvoiceV2Request {
  /**
   * Payment hash in URL-safe base64 format
   */
  payment_hash: string;
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

export interface DecodedPaymentRequest {
  destination: string;
  payment_hash: string;
  num_satoshis: string;
  timestamp: string;
  expiry: string;
  description: string;
  description_hash: string;
  fallback_addr: string;
  cltv_expiry: string;
  route_hints: Array<{
    hop_hints: Array<{
      node_id: string;
      chan_id: string;
      fee_base_msat: number;
      fee_proportional_millionths: number;
      cltv_expiry_delta: number;
    }>;
  }>;
  payment_addr: string;
  num_msat: string;
  features: Record<string, {
    name: string;
    is_required: boolean;
    is_known: boolean;
  }>;
}

export interface RouteFeesRequest {
  dest: string;
  amt_sat: string;
  timeout?: number;
  use_mission_control?: boolean;
  last_hop_pubkey?: string;
  outgoing_chan_id?: string;
}

export interface RouteFeesResponse {
  routing_fee_msat: string;
  time_lock_delay: number;
}

export interface SendPaymentRequest {
  payment_request?: string;
  dest?: string;
  amt?: string;
  payment_hash?: string;
  final_cltv_delta?: string;
  fee_limit_sat?: string;
  outgoing_chan_id?: string;
  last_hop_pubkey?: string;
  timeout_seconds?: string;
  no_inflight_updates?: boolean;
  max_parts?: string;
  amp?: boolean;
  dest_features?: number[];
  streaming?: boolean;
}

export interface SendPaymentResponse {
  payment_hash: string;
  payment_preimage: string;
  payment_route: {
    total_time_lock: number;
    total_fees: string;
    total_amt: string;
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
  };
  payment_error: string;
  failure_reason: string;
  status: 'UNKNOWN' | 'IN_FLIGHT' | 'SUCCEEDED' | 'FAILED';
  fee_sat: string;
  fee_msat: string;
  value_sat: string;
  value_msat: string;
  creation_time_ns: string;
  htlcs: Array<{
    status: string;
    route: {
      total_time_lock: number;
      total_fees: string;
      total_amt: string;
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
}

/**
 * Represents a payment status update from the TrackPayments or TrackPaymentV2 endpoints
 * This is returned by streaming endpoints and reflects the current state of a payment
 */
export interface PaymentStatus {
  payment_hash: string;
  status: 'UNKNOWN' | 'IN_FLIGHT' | 'SUCCEEDED' | 'FAILED';
  creation_date: string;
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
  value: string;
  value_sat: string;
  value_msat: string;
  payment_request: string;
  payment_preimage: string;
  fee: string;
  fee_sat: string;
  fee_msat: string;
  creation_time_ns: string;
  inflight: boolean;
  failure_reason: 'FAILURE_REASON_NONE' | 'FAILURE_REASON_TIMEOUT' | 'FAILURE_REASON_NO_ROUTE' | 'FAILURE_REASON_ERROR' | 'FAILURE_REASON_INCORRECT_PAYMENT_DETAILS' | 'FAILURE_REASON_INSUFFICIENT_BALANCE';
}

/**
 * Transaction types for the unified transaction history
 */
export type TransactionType = 'sent' | 'received';

/**
 * Transaction statuses for the unified transaction history
 */
export type TransactionStatus = 
  // Payment statuses
  'succeeded' | 'failed' | 'in_flight' | 'pending' |
  // Invoice statuses
  'settled' | 'accepted' | 'canceled' | 'expired';

/**
 * Unified transaction object that represents both payments and invoices
 */
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fee: number;
  timestamp: number;
  status: TransactionStatus;
  description: string;
  preimage: string;
  destination: string;
  payment_hash: string;
  raw_payment: Payment | null;
  raw_invoice: Invoice | null;
}

/**
 * Request parameters for listing transaction history
 */
export interface ListTransactionHistoryRequest {
  offset?: number;
  limit?: number;
  types?: TransactionType[];
  statuses?: TransactionStatus[];
  creation_date_start?: string;
  creation_date_end?: string;
}

/**
 * Response object for transaction history listing
 */
export interface ListTransactionHistoryResponse {
  transactions: Transaction[];
  offset: number;
  limit: number;
  total_count: number;
  has_more: boolean;
} 