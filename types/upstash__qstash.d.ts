declare module '@upstash/qstash' {
  export class Client {
    constructor(options: { token: string });
    publishJSON(options: {
      api: {
        name: string;
        provider: any;
      };
      body: any;
    }): Promise<any>;
  }

  export function resend(options: { token: string }): any;
}
