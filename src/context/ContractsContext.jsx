import React, { createContext, useState, useContext, useEffect } from 'react';

const ContractsContext = createContext();
const MAX_CONTRACTS = 20;

export const ContractsProvider = ({ children }) => {
  const [activeContracts, setActiveContracts] = useState(() => {
    const saved = localStorage.getItem('activeContracts');
    return saved ? JSON.parse(saved).slice(0, MAX_CONTRACTS) : [];
  });

  useEffect(() => {
    localStorage.setItem('activeContracts', JSON.stringify(activeContracts));
  }, [activeContracts]);

  const addLiveContract = (contract) => {
    if (!contract.contract_id) {
      console.error('Invalid contract: missing contract_id');
      return;
    }
    setActiveContracts((prev) => {
      if (prev.some((c) => c.contract_id === contract.contract_id)) {
        return prev;
      }
      const newContracts = [contract, ...prev].slice(0, MAX_CONTRACTS);
      return newContracts;
    });
  };

  const updateContract = (contractId, updates) => {
    setActiveContracts((prev) =>
      prev.map((c) =>
        c.contract_id === contractId ? { ...c, ...updates } : c
      )
    );
  };

  const removeContract = (contractId) => {
    setActiveContracts((prev) => prev.filter((c) => c.contract_id !== contractId));
  };

  return (
    <ContractsContext.Provider
      value={{ activeContracts, addLiveContract, updateContract, removeContract }}
    >
      {children}
    </ContractsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useContracts = () => useContext(ContractsContext);