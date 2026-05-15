import React from 'react';

export function LoadingContainer({ children }) {
  return <>{children}</>;
}

export function AccountData() {
  return null;
}

export function ContractData({ contract, method, methodArgs }) {
  return <span>--</span>;
}

export function ContractForm({ contract, method }) {
  return null;
}
