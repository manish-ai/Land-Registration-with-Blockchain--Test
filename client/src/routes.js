import buyerProfile from "./views/buyerProfile";
import Dashboard from "./views/Dashboard";
import viewImage from "./views/viewImage";
import OwnedLands from "./views/OwnedLands";
import MakePayment from "./views/MakePayment";
import updateBuyer from "./views/updateBuyer";
import Help from "./Help";

var routes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "tim-icons icon-chart-pie-36",
    component: Dashboard,
    layout: "/buyer",
  },
  {
    path: "/profile",
    name: "Buyer Profile",
    icon: "tim-icons icon-single-02",
    component: buyerProfile,
    layout: "/buyer",
  },
  {
    path: "/gallery",
    name: "Land Gallery",
    icon: "tim-icons icon-image-02",
    component: viewImage,
    layout: "/buyer",
  },
  {
    path: "/owned-lands",
    name: "Owned Lands",
    icon: "tim-icons icon-bank",
    component: OwnedLands,
    layout: "/buyer",
  },
  {
    path: "/payment",
    name: "Make Payment",
    icon: "tim-icons icon-money-coins",
    component: MakePayment,
    layout: "/buyer",
  },
  {
    path: "/help",
    name: "Help",
    icon: "tim-icons icon-support-17",
    component: Help,
    layout: "/buyer",
  },
  {
    path: "/update-profile",
    name: "",
    icon: "tim-icons",
    component: updateBuyer,
    layout: "/buyer",
  },
];
export default routes;
