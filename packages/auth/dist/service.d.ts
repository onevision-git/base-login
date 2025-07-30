export interface SignUpInput {
  tenantName: string;
  tenantDomain: string;
  email: string;
  password: string;
}
export interface LoginInput {
  email: string;
  password: string;
}
export interface AuthResult {
  token: string;
  user: Record<string, any>;
}
export declare function signUp(data: SignUpInput): Promise<AuthResult>;
export declare function login(data: LoginInput): Promise<AuthResult>;
export declare function getMe(token: string): Promise<Record<string, any>>;
export declare function logout(): boolean;
export declare function sendLoginLink(email: string): Promise<void>;
//# sourceMappingURL=service.d.ts.map
