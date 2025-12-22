import DeviceHistory from './pages/DeviceHistory';
import Devices from './pages/Devices';
import Home from './pages/Home';
import InspectionHistory from './pages/InspectionHistory';
import NewInspection from './pages/NewInspection';
import __Layout from './Layout.jsx';


export const PAGES = {
    "DeviceHistory": DeviceHistory,
    "Devices": Devices,
    "Home": Home,
    "InspectionHistory": InspectionHistory,
    "NewInspection": NewInspection,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};