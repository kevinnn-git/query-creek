import { WorkerRequest, WorkerResponse, QueryResult, TableSchema } from './types';

class DbClient {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private initialized = false;
  private storageMode: string = 'unknown';

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    this.worker = new Worker(new URL('./sqlite.worker.ts', import.meta.url), {
      type: 'module',
    });

    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id, success, data, error } = e.data;
      const pending = this.pendingRequests.get(id);
      if (pending) {
        this.pendingRequests.delete(id);
        if (success) {
          pending.resolve(data);
        } else {
          pending.reject(new Error(error || 'Database operation failed'));
        }
      }
    };

    this.worker.onerror = (err) => {
      console.error('[DbClient] Worker error detected. Initiating recovery restart:', err);
      try {
        this.worker?.terminate();
      } catch (e) {}
      this.worker = null;
      this.initialized = false;
      this.pendingRequests.forEach((p) =>
        p.reject(new Error('SQLite Worker encountered a fault and was automatically recovered.'))
      );
      this.pendingRequests.clear();
      this.initWorker();
    };
  }

  private sendRequest<T = any>(type: WorkerRequest['type'], payload?: any): Promise<T> {
    if (!this.worker) {
      this.initWorker();
    }

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      this.pendingRequests.set(id, { resolve, reject });
      this.worker!.postMessage({ id, type, payload });

      // Safety timeout after 10s
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Database request timeout for action: ${type}`));
        }
      }, 10000);
    });
  }

  public async initialize(): Promise<{ storage: string }> {
    if (this.initialized) return { storage: this.storageMode };
    const res = await this.sendRequest('init');
    this.initialized = true;
    this.storageMode = res.storage;
    return res;
  }

  public async query(sql: string, maxRows: number = 200): Promise<QueryResult> {
    await this.initialize();
    return this.sendRequest<QueryResult>('query', { sql, maxRows });
  }

  public async getSchema(): Promise<TableSchema[]> {
    await this.initialize();
    return this.sendRequest<TableSchema[]>('getSchema');
  }

  public async reset(): Promise<void> {
    await this.initialize();
    return this.sendRequest<void>('reset');
  }

  public getStorageMode(): string {
    return this.storageMode;
  }
}

export const dbClient = new DbClient();

