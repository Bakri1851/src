import React from "react";
import { Navigate } from "react-router-dom";
import { useAccount } from "wagmi";
import PropTypes from "prop-types";

export default function ProtectedRoute({ children }) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return <Navigate to="/connect-wallet" />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
