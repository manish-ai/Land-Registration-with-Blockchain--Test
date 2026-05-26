import SellerDashboard from "./views/SellerDashboard";
import AddLand from "./views/AddLand";
import ApproveRequest from "./views/ApproveRequest";
import sellerProfile from "./views/sellerProfile";
import viewImage from "./views/viewImage";
import updateSeller from "./views/updateSeller";
import Help from "./Help";
import AuditTrail from "./views/AuditTrail";

var routes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "tim-icons icon-chart-pie-36",
    component: SellerDashboard,
    layout: "/seller",
  },
  {
    path: "/add-land",
    name: "Add Land",
    icon: "tim-icons icon-world",
    component: AddLand,
    layout: "/seller",
  },
  {
    path: "/profile",
    name: "Seller Profile",
    icon: "tim-icons icon-single-02",
    component: sellerProfile,
    layout: "/seller",
  },
  {
    path: "/requests",
    name: "Land Requests",
    icon: "tim-icons icon-badge",
    component: ApproveRequest,
    layout: "/seller",
  },
  {
    path: "/gallery",
    name: "Land Gallery",
    icon: "tim-icons icon-image-02",
    component: viewImage,
    layout: "/seller",
  },
  {
    path: "/help",
    name: "Help",
    icon: "tim-icons icon-support-17",
    component: Help,
    layout: "/seller",
  },
  {
    path: "/update-profile",
    name: "",
    icon: "tim-icons",
    component: updateSeller,
    layout: "/seller",
  },
  {
    path: "/audit",
    name: "Audit Trail",
    icon: "tim-icons icon-notes",
    component: AuditTrail,
    layout: "/seller",
  },
];
export default routes;
