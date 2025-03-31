import axios, { AxiosInstance } from 'axios';
import { 
  LndConnectionConfig, 
  GetInfoResponse,
  ChannelBalanceResponse,
  AddInvoiceRequest,
  AddInvoiceResponse,
  LookupInvoiceRequest,
  Invoice,
  ListPaymentsRequest,
  ListPaymentsResponse
} from '../types/lnd';

export class LndClient {
  private readonly client: AxiosInstance;
  private readonly config: LndConnectionConfig;

  constructor(config: LndConnectionConfig) {
    this.config = config;

    // Create an axios instance with default configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Grpc-Metadata-macaroon': config.macaroon,
      },
      httpsAgent: config.tlsCert ? undefined : undefined, // TLS implementation can be added here
    });
  }

  /**
   * Get basic information about the LND node
   * @returns Information about the LND node
   */
  public async getInfo(): Promise<GetInfoResponse> {
    try {
      const response = await this.client.get<GetInfoResponse>('/v1/getinfo');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get LND info: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get channel balance information
   * @returns Channel balance information
   */
  public async channelBalance(): Promise<ChannelBalanceResponse> {
    try {
      const response = await this.client.get<ChannelBalanceResponse>('/v1/channels/balance');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get channel balance: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Create a new invoice
   * @param request Invoice parameters
   * @returns Invoice creation response
   */
  public async addInvoice(request: AddInvoiceRequest = {}): Promise<AddInvoiceResponse> {
    try {
      const response = await this.client.post<AddInvoiceResponse>('/v1/invoices', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to create invoice: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Lookup an invoice by payment hash
   * @param request Invoice lookup parameters
   * @returns Invoice details
   */
  public async lookupInvoiceV2(r_hash_str: string): Promise<Invoice> {
    try {
      const response = await this.client.get<Invoice>(`/v2/invoices/lookup?payment_hash=${r_hash_str}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to lookup invoice: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * List payments
   * @param request Payment listing parameters
   * @returns List of payments
   */
  public async listPayments(request: ListPaymentsRequest = {}): Promise<ListPaymentsResponse> {
    try {
      // Convert the request object to URL query parameters
      const params = new URLSearchParams();
      if (request.include_incomplete !== undefined) params.append('include_incomplete', request.include_incomplete.toString());
      if (request.index_offset) params.append('index_offset', request.index_offset);
      if (request.max_payments) params.append('max_payments', request.max_payments.toString());
      if (request.reversed !== undefined) params.append('reversed', request.reversed.toString());
      if (request.count_total_payments !== undefined) params.append('count_total_payments', request.count_total_payments.toString());
      if (request.creation_date_start) params.append('creation_date_start', request.creation_date_start);
      if (request.creation_date_end) params.append('creation_date_end', request.creation_date_end);

      const url = `/v1/payments?${params.toString()}`;
      const response = await this.client.get<ListPaymentsResponse>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to list payments: ${error.message}`);
      }
      throw error;
    }
  }
} 