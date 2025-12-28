import Cards from './pages/Cards';
import ChecklistManager from './pages/ChecklistManager';
import DeviceHistory from './pages/DeviceHistory';
import DeviceInspection from './pages/DeviceInspection';
import Devices from './pages/Devices';
import ExportTable from './pages/ExportTable';
import Home from './pages/Home';
import Info from './pages/Info';
import InspectionHistory from './pages/InspectionHistory';
import NewInspection from './pages/NewInspection';
import Users from './pages/Users';
import Admin from './pages/Admin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Cards": Cards,
    "ChecklistManager": ChecklistManager,
    "DeviceHistory": DeviceHistory,
    "DeviceInspection": DeviceInspection,
    "Devices": Devices,
    "ExportTable": ExportTable,
    "Home": Home,
    "Info": Info,
    "InspectionHistory": InspectionHistory,
    "NewInspection": NewInspection,
    "Users": Users,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};