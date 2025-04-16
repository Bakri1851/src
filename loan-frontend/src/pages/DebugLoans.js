import React from 'react';
import { useReadContract, useAccount } from 'wagmi';
import  FactoryConfig  from 'constants/FactoryConfig';

const DebugLoans = () => {
  const { address } = useAccount();

  const { data: loans, error, isLoading } = useReadContract({
    address: FactoryConfig.address,
    abi: FactoryConfig.abi,
    functionName: 'getLoansByLender',
    args: [address],
  });

  console.log('Loans fetched:', loans);
  console.error('Error:', error);

  return (
    <div className="flex justify-center items-center min-h-screen w-full">
      <div className="p-4 flex flex-col items-center text-center w-full max-w-3xl">
        <h3 className="text-xl font-bold mb-4">Loan Debug View</h3>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}
        {loans && loans.length > 0 ? (
          <ul className="w-full flex flex-col items-center">
            {loans.map((loan, index) => (
              <li key={index} className="text-center w-full">{loan}</li>
            ))}
          </ul>
        ) : (
          <p>No loans found for lender: {address}</p>
        )}
      </div>
    </div>
  );
};

export default DebugLoans;
