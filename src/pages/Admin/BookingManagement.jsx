import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {checkAdminSession} from "../../services/Utils.jsx";
import Spinner from "../../modules/Spinner.jsx";
import Table from "../../modules/Table.jsx";



function BookingManagement() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [allBookings, setAllBookings] = useState(null);


    useEffect(() => {
        checkAdminSession(navigate, setIsLoading, 1);
    }, []);


    useEffect(() => {
        setAllBookings(null);
    }, []);

    return (
        <>
            {isLoading && <Spinner/>}

            <div className={"booking-management-page"}>
                {(
                    (allBookings && Array.isArray(allBookings) && allBookings.length > 0) ? (
                        <Table tableData={[
                            ['1', '2', '3', '4', '5'],
                            ['6', '7', '8', '9', '10']
                        ]}
                               scrollable={true}
                               compact={true}
                               allowHideColumns={true}
                               defaultHiddenColumns={
                               []}
                               allowExport={true}
                               exportFileName={'bookings'}
                               sortConfigParam={{column: 0, direction: 'descending'}}
                               filterableColumns={
                               []}
                               onDeleteEntry={(rowIndex) => {
                                   const newBookings = [...allBookings];
                                   newBookings.splice(rowIndex, 1);
                                   setAllBookings(newBookings);
                               }}
                               allowDeleteEntryOption={true}
                        />

                    ) : (
                        isLoading ? <h1>Loading...</h1> : <h1>No bookings found.</h1>
                    )
                )}
            </div>

        </>
    );
}

export default BookingManagement;