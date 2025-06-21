import { useErrorToast } from '@/hooks/use-error-toast';

// Enhanced API client with automatic error handling
export class ApiClient {
  private baseUrl: string;
  private showErrorFromResponse: (response: Response, context?: any) => void;

  constructor(baseUrl: string = '', errorHandler?: (response: Response, context?: any) => void) {
    this.baseUrl = baseUrl;
    this.showErrorFromResponse = errorHandler || (() => {});
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & { errorContext?: string } = {}
  ): Promise<T> {
    const { errorContext, ...fetchOptions } = options;
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
        ...fetchOptions,
      });

      if (!response.ok) {
        this.showErrorFromResponse(response, errorContext);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        // Network error - will be handled by error toast hook
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, errorContext?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', errorContext });
  }

  async post<T>(endpoint: string, data?: any, errorContext?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      errorContext,
    });
  }

  async put<T>(endpoint: string, data?: any, errorContext?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      errorContext,
    });
  }

  async patch<T>(endpoint: string, data?: any, errorContext?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      errorContext,
    });
  }

  async delete<T>(endpoint: string, errorContext?: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', errorContext });
  }
}

// Hook to create API client with error toast integration
export function useApiClient() {
  const { showErrorFromResponse } = useErrorToast();
  
  return new ApiClient('', showErrorFromResponse);
}