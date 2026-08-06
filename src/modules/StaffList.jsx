import {useEffect, useMemo, useState} from "react";
import PropTypes from "prop-types";
import {useTranslation} from "react-i18next";
import Table from "./Table.jsx";
import Spinner from "./Spinner.jsx";
import {fetchPublicStaff} from "../services/Public/Staff/PublicStaffServices.jsx";

function StaffList({departmentKey, title, className}) {
    const {t, i18n} = useTranslation(['academics-pages', 'common']);
    const [staff, setStaff] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasFailed, setHasFailed] = useState(false);

    const language = i18n.language === 'ar' ? 'ar' : 'en';

    useEffect(() => {
        let isActive = true;

        setIsLoading(true);
        setHasFailed(false);

        fetchPublicStaff(departmentKey, language)
            .then((data) => {
                if (!isActive) {
                    return;
                }

                setStaff(data);
                setHasFailed(data === null);
            })
            .catch(() => {
                if (isActive) {
                    setStaff(null);
                    setHasFailed(true);
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [departmentKey, language]);

    const tableData = useMemo(() => {
        const headers = [
            t('academics-pages.staff.name-column-header'),
            t('academics-pages.staff.subject-column-header'),
            t('academics-pages.staff.title-column-header')
        ];

        const rows = (staff?.members || []).map((member) => [member.name, member.subject, member.position]);

        return [headers, ...rows];
    }, [staff, t, i18n.language]);

    const formattedLastUpdated = useMemo(() => {
        if (!staff?.lastUpdated) {
            return '';
        }

        return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Africa/Cairo'
        }).format(new Date(staff.lastUpdated * 1000));
    }, [staff, language]);

    return (
        <div className={className}>
            {isLoading && <Spinner/>}

            <div className={"extreme-padding-container"}>
                <h1>{title}</h1>

                {(!isLoading && hasFailed) && (
                    <p>{t('academics-pages.staff.unavailable')}</p>
                )}

                {(!isLoading && !hasFailed) && (
                    <>
                        {(staff?.highlights || []).map((highlight, index) => (
                            <p key={`${highlight.position}-${index}`}>
                                {highlight.position}: {highlight.name}
                            </p>
                        ))}

                        <Table tableData={tableData} numCols={3}
                               sortConfigParam={{column: 1, direction: 'ascending'}}
                               ignoreSideMarginsOnFixed={true}
                               isLoading={isLoading}
                        />

                        {formattedLastUpdated && (
                            <p>
                                {t('common.last-updated', {ns: 'common'})} {formattedLastUpdated}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

StaffList.propTypes = {
    departmentKey: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    className: PropTypes.string.isRequired,
};

export default StaffList;
