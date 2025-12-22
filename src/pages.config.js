import Home from './pages/Home';
import NewInspection from './pages/NewInspection';
import Devices from './pages/Devices';
import InspectionHistory from './pages/InspectionHistory';
import DeviceHistory from './pages/DeviceHistory';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "NewInspection": NewInspection,
    "Devices": Devices,
    "InspectionHistory": InspectionHistory,
    "DeviceHistory": DeviceHistory,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};