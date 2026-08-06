import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";
import {adminLoginPageUrl, endpoints, buildAuthHeaders} from "../../General/GeneralUtils.jsx";


const fetchStaffDirectory = async (navigate, setEmployeesData, setDepartments, setDisplayStyles) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return 'Session expired';
    }

    setEmployeesData(null);

    try {
        const response = await fetch(endpoints.getStaffDirectory, {method: 'GET',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.data) {
            setEmployeesData(result.data.employees);
            setDepartments(result.data.departments || []);
            setDisplayStyles(result.data.displayStyles || []);
        } else {
            setEmployeesData(null);

            if (result && result.message) {
                console.log(result.message);
            }

            if (result && result.code && (result.code === 401 || result.code === 403)) {
                navigate(adminLoginPageUrl, { replace: true });
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const postToStaffDirectory = async (endpoint, payload, fallbackMessage) => {
    try {
        const sessionId = await validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoint, {method: 'POST',
            body: JSON.stringify(payload),
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success) {
            return result;
        }

        return (result && result.message) || fallbackMessage;
    } catch (error) {
        return error.message;
    }
}

const addEmployee = async (employee) =>
    postToStaffDirectory(endpoints.addEmployee, employee, 'An error occurred while adding the employee.');

const editEmployee = async (employee) =>
    postToStaffDirectory(endpoints.editEmployee, employee, 'An error occurred while editing the employee.');

const deleteEmployee = async (employeeCode) =>
    postToStaffDirectory(endpoints.deleteEmployee, { employee_code: employeeCode }, 'An error occurred while deleting the employee.');


export {
    fetchStaffDirectory,
    addEmployee,
    editEmployee,
    deleteEmployee
}
