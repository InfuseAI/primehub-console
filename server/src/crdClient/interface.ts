
export interface CustomResource {
  get(name: string): Promise<any>;
  list(): Promise<any>;
  create(payload: any): Promise<any>;
  replace(name: string, payload: any): Promise<any>;
  patch(name: string, payload: any): Promise<any>;
  del(name: string): Promise<any>;
}

export interface CrdClient {
  containers(): CustomResource;
  datasets(): CustomResource;
  env(): CustomResource;
}
