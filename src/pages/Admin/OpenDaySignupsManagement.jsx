import '../../styles/AdminDashboard.css';
import {useEffect, useState} from "react";
import {useNavigate} from "react-router";
import Table from "../../modules/Table.jsx";
import {headToAdminLoginOnInvalidSession} from "../../services/Admin/Session/AdminNavigationServices.jsx";
import { fetchAllOpenDaySignups, deleteAllOpenDaySignups } from "../../services/Admin/OpenDaySignups/AdminOpenDaySignupsManagementServices.jsx";
import {msgTimeout, openDaySignupManagementPermissionLevel} from "../../services/General/GeneralUtils.jsx"
import { useLoading } from '../../services/General/GlobalLoadingService.jsx'
import {animated, useSpring} from "react-spring";
import {
    handleDeleteEventBookingsRequest
} from "../../services/Admin/EventBookings/AdminEventBookingManagementServices.jsx";


function OpenDaySignupsManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useLoading(false);
    const [openDaySignups, setOpenDaySignups] = useState(null);
    const [showDeleteOpenDaySignupsModal, setShowDeleteOpenDaySignupsModal] = useState(false);
    const [isDeletingOpenDaySignups, setIsDeletingOpenDaySignups] = useState(false);
    const [deleteOpenDaySignupsError, setDeleteOpenDaySignupsError] = useState(null);

    const animateDeleteOpenDaySignupsModal = useSpring({
        opacity: showDeleteOpenDaySignupsModal ? 1 : 0,
        transform: showDeleteOpenDaySignupsModal ? 'translateY(0)' : 'translateY(-100%)'
    });

    useEffect(() => {
        headToAdminLoginOnInvalidSession(navigate, openDaySignupManagementPermissionLevel, setIsLoading);
    }, []);

    const loadTableData = async () => {
        try {
            setIsLoading(true);
            await fetchAllOpenDaySignups(navigate, setOpenDaySignups)
        } catch (error) {
            console.log(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTableData();
    }, []);

    const columnDataTypes = {
        "date": ["Registration Created"],
    }

    const handleDeleteAll = async () => {


        setIsLoading(true);
        setIsDeletingOpenDaySignups(true);

        try {
            const response = await deleteAllOpenDaySignups(navigate);

            if (response.success) {
                setShowDeleteOpenDaySignupsModal(false);
                setDeleteOpenDaySignupsError(null);
                loadTableData();
            } else {
                setDeleteOpenDaySignupsError(response || 'An error occurred while deleting the bookings.');
                setTimeout(() => {setDeleteOpenDaySignupsError(null);}, msgTimeout);
            }
        } catch (error) {
            setDeleteOpenDaySignupsError(error.message || 'An error occurred while deleting the bookings.');
            setTimeout(() => {setDeleteOpenDaySignupsError(null);}, msgTimeout);
        } finally {
            setIsDeletingOpenDaySignups(false);
            setIsLoading(false);
        }
    }

    const handleCancelDeleteOpenDaySignupsModal = () => {
        setShowDeleteOpenDaySignupsModal(false);
        setDeleteOpenDaySignupsError(null);
    };

    const openDeleteOpenDaySignupsModal = () => {
        setDeleteOpenDaySignupsError(null);
        setShowDeleteOpenDaySignupsModal(true);
    }


    return (
        <>
            <div className={"open-day-signups-page"}>
                <Table tableData={openDaySignups}
                       scrollable={true}
                       compact={true}
                       allowHideColumns={true}
                       allowSticky={true}
                       forceEnglishTable={true}
                       defaultHiddenColumns={
                            [
                                'Registration Created',
                                'Children Created',
                            ]
                       }
                       dataTypes={columnDataTypes}
                       allowExport={true}
                       exportFileName={'open-day-signups'}
                       headerModuleElements={[
                           (
                               <button key={1} onClick={loadTableData} disabled={isLoading}>
                                   {isLoading ? 'Loading...' : 'Reload Table Data'}
                               </button>
                           ),
                           ...(openDaySignups && openDaySignups.length > 1 ? [
                               (
                                   <button key={2} onClick={openDeleteOpenDaySignupsModal} disabled={isDeletingOpenDaySignups}>
                                       {isDeletingOpenDaySignups ? 'Deleting...' : 'Delete All'}
                                   </button>
                               )
                           ] : [])
                       ]}
                       sortConfigParam={{column: 0, direction: 'descending'}}
                       filterableColumns={
                           [
                               'Payment Status',
                               'Registration Created'
                           ]
                       }
                       isLoading={isLoading}
                />
            </div>

            <animated.div style={animateDeleteOpenDaySignupsModal} className={"general-small-admin-action-modal"}>
                <div className={"general-small-admin-action-modal-overlay"} onClick={handleCancelDeleteOpenDaySignupsModal}/>

                <div className={"general-small-admin-action-modal-container"}>

                    <div className={"general-small-admin-action-modal-header"}>
                        <h3>
                            Delete Open Day Signups
                        </h3>
                    </div>

                    <div className={"general-small-admin-action-modal-content"}>

                        <p>
                            This will delete all open day signups. Are you sure you want to proceed?
                        </p>

                        {deleteOpenDaySignupsError && (
                            <>
                                <br/>
                                <p>{deleteOpenDaySignupsError}</p>
                            </>
                        )}
                    </div>

                    <div className={"general-small-admin-action-modal-footer"}>
                        <button onClick={handleCancelDeleteOpenDaySignupsModal}>
                            Cancel
                        </button>

                        <button onClick={handleDeleteAll} disabled={isDeletingOpenDaySignups}>
                            {isDeletingOpenDaySignups ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>

                </div>

            </animated.div>
        </>
    )
}

export default OpenDaySignupsManagement;