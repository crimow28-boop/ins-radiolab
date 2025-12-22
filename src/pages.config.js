import DeviceHistory from './pages/DeviceHistory';
import Home from './pages/Home';
import NewInspection from './pages/NewInspection';
import Devices from './pages/Devices';
import InspectionHistory from './pages/InspectionHistory';
import __Layout from './Layout.jsx';


export const PAGES = {
    "DeviceHistory": DeviceHistory,
    "Home": Home,
    "NewInspection": NewInspection,
    "Devices": Devices,
    "InspectionHistory": InspectionHistory,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};