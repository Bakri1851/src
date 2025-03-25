/**
=========================================================
* Soft UI Dashboard React - v4.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import React from "react";
import ReactDOM from "react-dom/client";
import App from "App";

import {RainbowKitProvider} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from 'wagmi';


// Soft UI Dashboard React Context Provider
import { BrowserRouter } from "react-router-dom";
import { SoftUIControllerProvider } from "context";

import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig } from "./wagmi";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <WagmiProvider config={wagmiConfig}>
    <RainbowKitProvider>
      <BrowserRouter>
        <SoftUIControllerProvider>
          <App />
        </SoftUIControllerProvider>
      </BrowserRouter>
    </RainbowKitProvider>
  </WagmiProvider>
);
