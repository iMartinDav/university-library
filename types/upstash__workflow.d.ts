declare module '@upstash/workflow' {
  export class Client {
    constructor(options: { 
      baseUrl: string;
      token: string; 
    });
  }
}
