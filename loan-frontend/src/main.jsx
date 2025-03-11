import React from 'react'
import ReactDOM from 'react-dom'
import {WagmiConfig} from '@wagmi/core';
import App from "./App";
import {client} from "./utils/wagmi";



ReactDOM.render(
  <React.StrictMode>
    <WagmiConfig client={client}>
      <App />
    </WagmiConfig>
  </React.StrictMode>,
  document.getElementById('root')
);
