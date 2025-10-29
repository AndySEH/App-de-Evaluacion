export type AuthUser = {
  // Primary identifier (UID) used by the backend
  uid?: string;
  // alternative id fields sometimes used by APIs
  id?: string;
  _id?: string;

  email: string;
  name?: string;
  password?: string;

  // allow extra fields returned by the server
  [key: string]: any;
};
