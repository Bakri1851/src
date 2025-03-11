import React from 'react'
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import WalletConnect from './utils/walletConnect'
import LoanActions from './components/LoanActions'

const App = () => {

  return (
    <div>
      <h1>
      Rate Swiching Loan
      </h1>
      <WalletConnect/>
      <LoanActions/>
    </div>
  );
};

export default App
