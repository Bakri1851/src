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

/** 
  All of the routes for the Soft UI Dashboard React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Soft UI Dashboard React base styles
import Dashboard from "pages/Dashboard";
import MyLoans from "pages/myLoans";
import MyBorrowedLoans from "pages/myBorrowedLoans";
import CreateProposal from "pages/CreateProposal";
import ProposalExplorer from "pages/ProposalExplorer";

// Soft UI Dashboard React icons
import Office from "examples/Icons/Office";
import Settings from "examples/Icons/Settings";
import Document from "examples/Icons/Document";
import CreditCard from "examples/Icons/CreditCard";
import Cube from "examples/Icons/Cube";
import ProtectedRoute from "protectedRoute";

const routes = [
  {
    type: "title",
    title: "Home",
    key: "home",
  },
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <Office size="12px" />,
    route: "/dashboard",
    component: <Dashboard />,
  },
  {
    type: "divider",
  },
  {
    type: "title",
    title: "Proposals",
    key: "proposals",
  },
  {
    type: "collapse",
    name: "Create Proposal",
    key: "createProposal",
    icon: <Settings size="12px" />,
    route: "/createProposal",
    component: (
      <ProtectedRoute>
        <CreateProposal />
      </ProtectedRoute>
    ),
  },
  {
    type: "collapse",
    name: "Proposal Explorer",
    key: "proposalExplorer",
    icon: <Cube size="12px" />,
    route: "/proposalExplorer",
    component: (
      <ProtectedRoute>
        <ProposalExplorer />
      </ProtectedRoute>
    ),
  },

  {
    type: "divider",
  },
  {
    type: "title",
    title: "Loans",
    key: "loans",
  },

  {
    type: "collapse",
    name: "My Loans",
    key: "myLoans",
    icon: <Document size="12px" />,
    route: "/myLoans",
    component: (
      <ProtectedRoute>
        <MyLoans />
      </ProtectedRoute>
    ),
  },
  {
    type: "collapse",
    name: "My Borrowed Loans",
    key: "myBorrowedLoans",
    icon: <CreditCard size="12px" />,
    route: "/myBorrowedLoans",
    component: (
      <ProtectedRoute>
        <MyBorrowedLoans />
      </ProtectedRoute>
    ),
  },
];

export default routes;
