export const TOKENS = {
  AuthRemoteDS: Symbol("AuthRemoteDS"),
  AuthRepo: Symbol("AuthRepo"),
  LoginUC: Symbol("LoginUC"),
  SignupUC: Symbol("SignupUC"),
  LogoutUC: Symbol("LogoutUC"),
  GetCurrentUserUC: Symbol("GetCurrentUserUC"),
  ProductRemoteDS: Symbol("ProductRemoteDS"),
  ProductRepo: Symbol("ProductRepo"),
  AddProductUC: Symbol("AddProductUC"),
  UpdateProductUC: Symbol("UpdateProductUC"),
  DeleteProductUC: Symbol("DeleteProductUC"),
  GetProductsUC: Symbol("GetProductsUC"),
  GetProductByIdUC: Symbol("GetProductByIdUC"),
  // Add Product tokens if you want to DI those too...
} as const;
