import DeviceHistory from './pages/DeviceHistory';
import Devices from './pages/Devices';
import Home from './pages/Home';
import InspectionHistory from './pages/InspectionHistory';
import NewInspection from './pages/NewInspection';
import Special from './pages/Special';
import Routine from './pages/Routine';
import Info from './pages/Info';
import __Layout from './Layout.jsx';


export const PAGES = {
    "DeviceHistory": DeviceHistory,
    "Devices": Devices,
    "Home": Home,
    "InspectionHistory": InspectionHistory,
    "NewInspection": NewInspection,
    "Special": Special,
    "Routine": Routine,
    "Info": Info,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};