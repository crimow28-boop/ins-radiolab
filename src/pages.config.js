import ChecklistManager from './pages/ChecklistManager';
import DeviceHistory from './pages/DeviceHistory';
import DeviceInspection from './pages/DeviceInspection';
import Devices from './pages/Devices';
import Home from './pages/Home';
import Info from './pages/Info';
import InspectionHistory from './pages/InspectionHistory';
import NewInspection from './pages/NewInspection';
import Users from './pages/Users';
import Special from './pages/Special';
import Routine from './pages/Routine';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ChecklistManager": ChecklistManager,
    "DeviceHistory": DeviceHistory,
    "DeviceInspection": DeviceInspection,
    "Devices": Devices,
    "Home": Home,
    "Info": Info,
    "InspectionHistory": InspectionHistory,
    "NewInspection": NewInspection,
    "Users": Users,
    "Special": Special,
    "Routine": Routine,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};