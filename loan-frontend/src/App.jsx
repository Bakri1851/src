import React from 'react'
import './App.css'

import WalletConnect from './utils/walletConnect'
import LoanActions from './components/LoanActions'

const App = () => {

  return (
    <div>
      <h1>
      Rate Switching Loan
      </h1>
      <WalletConnect/>
      <LoanActions/>
    </div>
  );
};

export default App
