import LIDashboard from "./views/LIDashboard";
import LandVerifications from "./views/LandVerifications";
import ApproveTransaction from "./views/ApproveTransaction";
import BuyerInfo from "./views/BuyerInfo";
import SellerInfo from "./views/SellerInfo";
import TransactionInfo from "./views/TransactionInfo";
import AuditTrail from "./views/AuditTrail";

var routes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "tim-icons icon-chart-pie-36",
    component: LIDashboard,
    layout: "/admin",
  },
  {
    path: "/land-verifications",
    name: "Land Verifications",
    icon: "tim-icons icon-badge",
    component: LandVerifications,
    layout: "/admin",
  },
  {
    path: "/buyers",
    name: "Buyer Info",
    icon: "tim-icons icon-single-02",
    component: BuyerInfo,
    layout: "/admin",
  },
  {
    path: "/sellers",
    name: "Seller Info",
    icon: "tim-icons icon-single-02",
    component: SellerInfo,
    layout: "/admin",
  },
  {
    path: "/transactions",
    name: "Transactions",
    icon: "tim-icons icon-send",
    component: TransactionInfo,
    layout: "/admin",
  },
  {
    path: "/approve",
    name: "Approve Transfer",
    icon: "tim-icons icon-check-2",
    component: ApproveTransaction,
    layout: "/admin",
  },
  {
    path: "/audit",
    name: "Audit Trail",
    icon: "tim-icons icon-notes",
    component: AuditTrail,
    layout: "/admin",
  },
];
export default routes;
