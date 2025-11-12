import { useCallback } from "react";
import {v6 as uuidv6} from "uuid";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import '../../public/assets/fonts/American Typewriter/american-typewriter-bold-bold.js';
import '../../public/assets/fonts/Futura/Futura Book font-normal.js'
import '../../public/assets/fonts/American Typewriter/American Typewriter Regular-normal.js'
import '../../public/assets/fonts/Futura/futur-bold.js'
import '../../public/assets/fonts/Futura/Futura Book Italic font-italic.js'


const isDevelopment = () => {
    return !import.meta.env.PROD;
};

const BASE_URLS = {
    development: 'http://localhost:8080',
    production: ''
};

const getBaseUrl = () => {
    return isDevelopment() ? BASE_URLS.development : BASE_URLS.production;
};

const ENDPOINTS = {
    checkBookingSession: '/scripts/checkBookingSession.php',
    getAllBookings: '/scripts/getAllBookings.php',
    validateBookingLogin: '/scripts/validateBookingLogin.php',
    createBookingSession: '/scripts/createBookingSession.php',
    deleteBookingEntry: '/scripts/deleteBookingEntry.php',
    submitAddBookingForm: '/scripts/submitAddBookingForm.php',
    getBookingInfoBySession: '/scripts/getBookingBySession.php',
    submitEditBookingForm: '/scripts/submitEditBookingForm.php',
    createAdminSession: '/scripts/createAdminSession.php',
    validateAdminSession: '/scripts/checkAdminSession.php',
    validateAdminLogin: '/scripts/validateAdminLogin.php',
    getDashboardPermissions: '/scripts/getDashboardPermissions.php',
    getUserPermissions: '/scripts/getUserPermissions.php',
    submitForm: '/scripts/submitForm.php',
    submitJobApplication: '/scripts/submitJobApplication.php',
    getJobApplications: '/scripts/getJobApplications.php',
    updateBookingExtras: '/scripts/submitUpdateBookingExtras.php',
    getBookingConfirmation: '/scripts/getBookingConfirmation.php'
};

const generateEndpoints = () => {
    const baseUrl = getBaseUrl();
    const fullEndpoints = {};

    for (const [key, path] of Object.entries(ENDPOINTS)) {
        fullEndpoints[key] = `${baseUrl}${path}`;
    }

    return fullEndpoints;
};

const sessionDurationInHours = 12;
const sessionDuration = sessionDurationInHours * 60 * 60 * 1000;
const msgTimeout = 5000;
const bookingLoginPageUrl = '/events/booking';
const bookingDashboardPageUrl = '/events/booking/dashboard';
const adminLoginPageUrl = '/admin/login';
const adminDashboardPageUrl = '/admin/dashboard';

export const endpoints = generateEndpoints();

const fetchBookingConfirmationRequest = async (bookingId, extrasId, username, password_hash) => {
    try {
        const response = await fetch(endpoints.getBookingConfirmation, {
            method: 'POST',
            body: JSON.stringify({bookingId: bookingId, username: username, password_hash: password_hash, extrasId: extrasId})
        })
        
        const result = await response.json();
        
        if (result && result.success) {
            return result;
        } else {
            return result.message || result || 'An error occurred while fetching booking confirmation.';
        }
        
    } catch (error) {
        return error.message || error || 'An error occurred while fetching booking confirmation.';
    }
}

const submitUpdateBookingExtrasRequest = async (formData, bookingId, navigate) => {
    try {
        const sessionId = validateBookingSessionLocally();
        
        if (!sessionId) {
            return 'Session expired';
        }
        
        const response = await fetch (endpoints.checkBookingSession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        })
        
        const result = await response.json();
        
        if (result && !result.success) {
            if (result.message) {
                console.log(result.message);
            }
            
            navigate(bookingLoginPageUrl);
        }
        
        formData.append('bookingId', bookingId);
        
        const updateResponse = await fetch(endpoints.updateBookingExtras, {
            method: 'POST',
            body: formData
        });
        
        const updateResult = await updateResponse.json();
        
        if (updateResult && updateResult.success) {
            return updateResult;
        } else {
            if (updateResult && updateResult.message) {
                return updateResult.message;
            } else {
                return 'Update failed. Please try again.';
            }
        }
    } catch ( error ) {
        return error.message;
    }
    
}

const handleEditBookingRequest = async (formData, bookingId) => {
    try {
        const sessionId = validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        formData.append('bookingId', bookingId);

        const response = await fetch(endpoints.submitEditBookingForm, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            return `${result.message}`;
        }
    } catch (error) {
        return error.message;
    }
};

const fetchBookingInfoBySessionRequest = async (navigate) => {
    try {
        const sessionId = validateBookingSessionLocally();

        if (!sessionId) {
            navigate(bookingLoginPageUrl);
            return 'Session expired';
        }

        const response = await fetch(endpoints.getBookingInfoBySession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result && result.success) {
            return result;
        } else {
            if (result && result.message) {
                return result;
            }

            if (result && result.code && (result.code === 401 || result.code === 403)) {
                navigate(bookingLoginPageUrl);
            }
        }
    } catch (error) {
         return error.message;
    }
}

const submitFormRequest = async (formData) => {
    try {
        const response = await fetch(endpoints.submitForm, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            if (result.message) {
                return `${result.message}`;
            } else {
                return 'Form submission failed. Please try again.';
            }
        }
    } catch (error) {
        return error.message;
    }
}

const submitJobApplicationRequest = async (formData) => {
    try {
        const response = await fetch(endpoints.submitJobApplication, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            if (result.message) {
                return `${result.message}`;
            } else {
                return 'Form submission failed. Please try again.';
            }
        }
    } catch (error) {
        return error.message;
    }
}

const fetchJobApplicationsRequest = async (navigate, setJobApplications) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        console.log('Session expired');
    }

    setJobApplications(null);
    const timestamp = new Date().getTime();

    try {
        const response = await fetch(endpoints.getJobApplications + '?_=' + timestamp,
            {method: 'POST', body: JSON.stringify({session_id: sessionId})});


        const result = await response.json();

        if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
            setJobApplications(result.data);
        } else {
            setJobApplications(null);

            if (result && result.message) {
                console.log(result.message);
            }

            if (result && result.code && (result.code === 401 || result.code === 403)) {
                navigate(adminLoginPageUrl);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const fetchBookingsRequest = async (navigate, setAllBookings) => {
    try {
        const sessionId = validateAdminSessionLocally();

        if (!sessionId) {
            navigate(adminLoginPageUrl);
            return;
        }

        const response = await fetch(endpoints.getAllBookings,
            {method: 'POST', body: JSON.stringify({session_id: sessionId})});
        const result = await response.json();

        if (result) {
            if (result.success && result.data) {
                setAllBookings( result.data );
            } else {
                if (result.message) {
                    console.log(result.message);
                }


                if (result.code  && (result.code === 401 || result.code === 403)) {
                    navigate(adminLoginPageUrl);
                }
            }
        }

    } catch (error) {
        console.log(error.message);
    }

    return null;
}

const handleDeleteBookingRequest = async (bookingId) => {
    try {
        const sessionId = validateAdminSessionLocally();
        if (!sessionId) {
            return 'Session expired'
        }

        const response = await fetch(endpoints.deleteBookingEntry, {
            method: 'POST',
            body: JSON.stringify({bookingId: bookingId, session_id: sessionId})
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            return result.message;
        }

    } catch (error) {
        return error.message;
    }
}

const checkBookingSessionFromBookingDashboard = async (navigate) => {
    const sessionId = validateBookingSessionLocally();

    if (!sessionId) {
        navigate(bookingLoginPageUrl);
        return;
    }

    try {
        const response = await fetch(endpoints.checkBookingSession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result && !result.success) {

            if (result.message ) {
                console.log(result.message);
            }

            navigate(bookingLoginPageUrl);
        }
    } catch (error) {
        console.log(error.message);
        navigate(bookingLoginPageUrl);
    }
}

const handleAddBookingRequest = async (formData) => {
    try {
        const sessionId = validateAdminSessionLocally();

        if (!sessionId) {
            return 'Session expired';
        }

        const response = await fetch(endpoints.submitAddBookingForm, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            return `${result.message}`;
        }
    } catch (error) {
        return error.message;
    }
}

const validateBookingLogin = async (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];

    try {
        const response = await fetch(endpoints.validateBookingLogin, {
            method: 'POST',
            body: JSON.stringify({username, password})
        });

        const result = await response.json();

        if (result.success) {
            const sessionResponse = await fetch(endpoints.createBookingSession, {
                method: 'POST',
                body: JSON.stringify({username: username, session_id: createSessions('harvest_schools_booking')})
            });

            const sessionResult = await sessionResponse.json();

            if (sessionResult.success) {
                navigate(bookingDashboardPageUrl);
            } else {
                return sessionResult;
            }
        } else {
            return result;
        }
    } catch (error) {
        return error.message;
    }
}

const checkBookingSessionFromBookingLogin = async (navigate) => {
    const sessionId = validateBookingSessionLocally();
    if (!sessionId) {return;}

    try {
        const response = await fetch(endpoints.checkBookingSession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result.success) {
            navigate(bookingDashboardPageUrl);
        } else {
           if (result.message) {
                console.log(result.message);
           }
        }
    } catch (error) {
        return error.message;
    }
}

const checkAdminSessionFromAdminDashboard = async (navigate, setDashboardOptions) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl);
        return;
    }

    try {
        const sessionResponse = await fetch(endpoints.validateAdminSession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const sessionResult = await sessionResponse.json();

        if (sessionResult && !sessionResult.success) {
            if (sessionResult.message) {
                console.log(sessionResult.message);
            }

            navigate(adminLoginPageUrl);
        }

        const permissionsResponse = await fetch(endpoints.getDashboardPermissions, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const permissionsResult = await permissionsResponse.json();

        if (permissionsResult.success) {
            setDashboardOptions(permissionsResult.dashboardOptions);
        } else {
            if (permissionsResult.message) {
                console.log(permissionsResult.message);
            }

            if (permissionsResult.code && (permissionsResult.code === 401 || permissionsResult.code === 403 || permissionsResult.code === 404))  {
                navigate(adminLoginPageUrl);
            }
        }

    } catch (error) {
        console.log(error.message);
    }
}

const validateAdminLogin = async (formData, usernameFieldId, passwordFieldId, navigate) => {
    const formDataEntries = Array.from(formData.entries());
    const username = formDataEntries.find(entry => entry[0] === ('field_' + usernameFieldId))[1];
    const password = formDataEntries.find(entry => entry[0] === ('field_' + passwordFieldId))[1];

    try {
        const response = await fetch(endpoints.validateAdminLogin, {
            method: 'POST',
            body: JSON.stringify({username, password})
        });

        const result = await response.json();

        if (result.success) {
            const sessionResponse = await fetch(endpoints.createAdminSession, {
                method: 'POST',
                body: JSON.stringify({ username: username, session_id: createSessions('harvest_schools_admin') })
            });

            const sessionResult = await sessionResponse.json();

            if (sessionResult.success) {
                navigate(adminDashboardPageUrl);
            } else {
                return sessionResult;
            }
        } else {
            return result;
        }
    } catch (error) {
        return error.message;
    }
}

const checkAdminSessionFromAdminLogin = async (navigate) => {
    const sessionId = validateAdminSessionLocally();
    if (!sessionId) {return;}

    try {
        const response = await fetch(endpoints.validateAdminSession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result.success) {
            extendSession('harvest_schools_admin', sessionId);
            navigate(adminDashboardPageUrl);
        } else {
            if (result.message) {
                console.log(result.message);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const checkAdminSession = async (navigate, allowedPermission) => {
    const sessionId = validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl);
        return;
    }

    try {
        const response = await fetch(endpoints.validateAdminSession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result.success) {
            extendSession('harvest_schools_admin', sessionId);
        } else {
            if (result.message) {
                console.log(result.message);
            }

            navigate(adminLoginPageUrl);

        }

        const userPermissionsResponse = await fetch(endpoints.getUserPermissions, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const userPermissionsResult = await userPermissionsResponse.json();

        if (userPermissionsResult && userPermissionsResult.success && userPermissionsResult.cleanPermissionLevels) {
            if (!userPermissionsResult.cleanPermissionLevels.includes(allowedPermission)) {
                navigate(adminLoginPageUrl);
            }

            return userPermissionsResult;
        } else {
            if (userPermissionsResult.message) {
                console.log(userPermissionsResult.message);
            }

            if (userPermissionsResult.code && (userPermissionsResult.code === 401 || userPermissionsResult.code === 403 || userPermissionsResult.code === 404)) {
                navigate(adminLoginPageUrl);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const checkBookingSession = async (navigate) => {
    const sessionId = validateBookingSessionLocally();

    if (!sessionId) {
        navigate(bookingLoginPageUrl);
        return;
    }

    try {
        const response = await fetch(endpoints.checkBookingSession, {
            method: 'POST',
            body: JSON.stringify({session_id: sessionId})
        });

        const result = await response.json();

        if (result.success) {
            extendSession('harvest_schools_booking', sessionId);
        } else {
            if (result.message) {
                console.log(result.message);
            }

            navigate(bookingLoginPageUrl);
        }
    } catch (error) {
        console.log(error.message);
    }
}

const headToBookingLoginOnInvalidSession = async (navigate, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkBookingSession(navigate);

    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

const headToAdminLoginOnInvalidSession = async (navigate, allowedPermission, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkAdminSession(navigate, allowedPermission);

    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

const headToAdminLoginOnInvalidSessionFromAdminDashboard = async (navigate, setDashboardOptions, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkAdminSessionFromAdminDashboard(navigate, setDashboardOptions)
    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

const headToBookingLoginOnInvalidSessionFromBookingDashboard = async (navigate, setIsLoading) => {
    setIsLoading(true);

    try {
        await checkBookingSessionFromBookingDashboard(navigate);
    } catch (error) {
        console.log(error.message);
        navigate(bookingLoginPageUrl);
    } finally {
        setIsLoading(false);
    }
}

const headToAdminDashboardOnValidSession = async (navigate, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkAdminSessionFromAdminLogin(navigate);
    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

const headToBookingDashboardOnValidSession = async (navigate, setIsLoading) => {
    try {
        setIsLoading(true);
        await checkBookingSessionFromBookingLogin(navigate);
    } catch (error) {
        console.log(error.message);
    } finally {
        setIsLoading(false);
    }
}

const getCookies = () => {
    return document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {});
}

const formatDateFromPacific = (pacificTimeString) => {
    const [datePart, timePart] = pacificTimeString.split(' ');
    const pacificDate = new Date(`${datePart}T${timePart}-07:00`);

    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };

    return pacificDate.toLocaleString(undefined, options);
};

const createSessions = (sessionName,) => {
    const sessionId = uuidv6();
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + sessionDurationInHours);
    document.cookie = `${sessionName}_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/; SameSite=None; Secure`;
    document.cookie = `${sessionName}_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/; SameSite=None; Secure`;
    return sessionId;
}

const extendSession = (sessionName, sessionId) => {
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + sessionDurationInHours);
    document.cookie = `${sessionName}_session_id=${sessionId}; expires=${sessionExpiry.toUTCString()}; path=/; SameSite=None; Secure`;
    document.cookie = `${sessionName}_session_time=${Date.now()}; expires=${sessionExpiry.toUTCString()}; path=/; SameSite=None; Secure`;
}

const resetSession = (sessionName) => {
    document.cookie = `${sessionName}_session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${sessionName}_session_time=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

const validateBookingSessionLocally = () => {
    const cookies = getCookies();
    const sessionId = cookies.harvest_schools_booking_session_id;
    const sessionTime = parseInt(cookies.harvest_schools_booking_session_time, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        resetSession('harvest_schools_booking');
        return null;
    } else {
        return sessionId;
    }
}

const validateAdminSessionLocally = () => {
    const cookies = getCookies();
    const sessionId = cookies.harvest_schools_admin_session_id;
    const sessionTime = parseInt(cookies.harvest_schools_admin_session_time, 10);

    if (!sessionId || !sessionTime || (Date.now() - sessionTime) > sessionDuration) {
        resetSession('harvest_schools_admin');
        return null;
    } else {
        return sessionId;
    }
}

const useFormCache = (formTitle, fields) => {
    const CACHE_DURATION_IN_HOURS = 4;
    const CACHE_DURATION = CACHE_DURATION_IN_HOURS * 60 * 60 * 1000;

    const getStorageKey = (formTitle, fieldId, fieldLabel) => {
        return `form_${formTitle}_${fieldLabel}_${fieldId}`;
    };

    const getTimestampKey = (formTitle) => {
        return `form_${formTitle}_timestamp`;
    };

    const loadCachedValues = useCallback(() => {
        const timestampKey = getTimestampKey(formTitle);
        const cachedTimestamp = localStorage.getItem(timestampKey);

        if (cachedTimestamp) {
            const cacheTime = parseInt(cachedTimestamp, 10);
            const currentTime = Date.now();
            const timeDifference = currentTime - cacheTime;

            if (timeDifference > CACHE_DURATION) {
                clearCache();
                return {};
            }
        } else {
            return {};
        }

        const cachedValues = {};
        fields.forEach(field => {
            const storageKey = getStorageKey(formTitle, field.id, field.label);
            const cachedValue = localStorage.getItem(storageKey);
            if (cachedValue !== null) {
                cachedValues[field.id] = cachedValue;
            }
        });
        return cachedValues;
    }, [formTitle, fields, CACHE_DURATION]);

    const saveToCache = useCallback((field, value) => {
        const storageKey = getStorageKey(formTitle, field.id, field.label);
        const timestampKey = getTimestampKey(formTitle);

        if (value) {
            localStorage.setItem(storageKey, value);
            localStorage.setItem(timestampKey, Date.now().toString());
        } else {
            localStorage.removeItem(storageKey);
        }
    }, [formTitle]);

    const clearCache = useCallback(() => {
        const timestampKey = getTimestampKey(formTitle);

        fields.forEach(field => {
            const storageKey = getStorageKey(formTitle, field.id, field.label);
            localStorage.removeItem(storageKey);
        });

        localStorage.removeItem(timestampKey);
    }, [fields, formTitle]);

    return { loadCachedValues, saveToCache, clearCache };
};

const generateConfirmationPDF = async (action = 'download', setIsLoading, bookingId, bookingUsername, detailedData, setError) => {
    try {
        setIsLoading(true);

        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        const titleFontName = 'American Typewriter Regular';
        const titleFontWeight = 'normal';
        const subTextFontName = 'Futura Book font';
        const subTextFontWeight = 'normal';
        const textFontName = 'futur';
        const textFontWeight = 'bold';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        const addFooter = () => {
            pdf.setFont('Futura Book Italic font', 'italic');
            pdf.setFontSize(9);
            pdf.text('This is an automatically generated confirmation document.', pageWidth / 2, pageHeight - 10, { align: 'center' });
            pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
        };
        
        const truncateText = (text, maxLength = 100) => {
            if (!text) return '';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        };
        
        const checkPageBreak = (currentY, requiredSpace = 10) => {
            if (currentY > pageHeight - requiredSpace - 10) {
                addFooter();
                pdf.addPage();
                return margin;
            }
            return currentY;
        };
        
        try {
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                logoImg.onload = resolve;
                logoImg.onerror = reject;
                logoImg.src = '/assets/images/HarvestLogos/HarvestLogo-01.png';
            });
            
            const logoWidth = 60;
            const logoHeight = 40;
            const logoX = (pageWidth - logoWidth) / 2;
            pdf.addImage(logoImg, 'PNG', logoX, 15, logoWidth, logoHeight);
        } catch (logoError) {
            console.warn('Could not load logo:', logoError);
        }
        
        let yPosition = 70;
        
        pdf.setFont('american-typewriter-bold', 'bold');
        pdf.setFontSize(24);
        pdf.text('Booking Confirmation', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 20;
        
        pdf.setFont(titleFontName, titleFontWeight);
        pdf.setFontSize(16);
        pdf.text('Booking Information', margin, yPosition);
        yPosition += 10;
        
        pdf.setFont(subTextFontName, subTextFontWeight);
        pdf.setFontSize(11);
        
        const leftColumnX = margin;
        const rightColumnX = pageWidth / 2;
        let leftY = yPosition;
        let rightY = yPosition;
        
        if (bookingId) {
            pdf.setFont(textFontName, textFontWeight);
            pdf.text('Booking ID:', leftColumnX, leftY);
            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.text(bookingId.toString(), leftColumnX + 25, leftY);
            leftY += 6;
        }
        
        if (bookingUsername) {
            pdf.setFont(textFontName, textFontWeight);
            pdf.text('Username:', leftColumnX, leftY);
            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.text(truncateText(bookingUsername), leftColumnX + 25, leftY);
            leftY += 6;
        }
        
        if (detailedData?.booking?.status) {
            pdf.setFont(textFontName, textFontWeight);
            pdf.text('Status:', leftColumnX, leftY);
            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.text(truncateText(detailedData.booking.status), leftColumnX + 25, leftY);
            leftY += 6;
        }
        
        if (detailedData?.booking?.password_hash) {
            pdf.setFont(textFontName, textFontWeight);
            pdf.text('Auth ID:', rightColumnX, rightY);
            pdf.setFont(subTextFontName, subTextFontWeight);
            const authId = detailedData.booking.password_hash;
            const wrappedAuthId = pdf.splitTextToSize(authId, 60);
            pdf.text(wrappedAuthId, rightColumnX + 20, rightY);
            rightY += (wrappedAuthId.length * 6);
        }
        
        yPosition = Math.max(leftY, rightY) + 10;
        
        if (detailedData?.parents && detailedData.parents.length > 0) {
            yPosition = checkPageBreak(yPosition, 40);
            
            pdf.setFont(titleFontName, titleFontWeight);
            pdf.setFontSize(16);
            pdf.text('Parent Information', margin, yPosition);
            yPosition += 15;
            
            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.setFontSize(11);
            
            const columnWidth = contentWidth / 2 - 10;
            const leftColX = margin;
            const rightColX = margin + columnWidth + 20;
            
            for (let i = 0; i < detailedData.parents.length; i += 2) {
                yPosition = checkPageBreak(yPosition, 35);
                
                const leftParent = detailedData.parents[i];
                const rightParent = detailedData.parents[i + 1];
                
                let leftY = yPosition;
                let rightY = yPosition;
                
                pdf.setFont(textFontName, textFontWeight);
                pdf.text(`Parent ${i + 1}:`, leftColX, leftY);
                leftY += 6;
                
                pdf.setFont(subTextFontName, subTextFontWeight);
                if (leftParent.name) {
                    pdf.text(`Name: ${truncateText(leftParent.name, 40)}`, leftColX + 5, leftY);
                    leftY += 5;
                }
                if (leftParent.email) {
                    pdf.text(`Email: ${truncateText(leftParent.email, 35)}`, leftColX + 5, leftY);
                    leftY += 5;
                }
                if (leftParent.phone_number) {
                    pdf.text(`Phone: ${truncateText(leftParent.phone_number, 35)}`, leftColX + 5, leftY);
                    leftY += 5;
                }
                
                if (rightParent) {
                    pdf.setFont(textFontName, textFontWeight);
                    pdf.text(`Parent ${i + 2}:`, rightColX, rightY);
                    rightY += 6;
                    
                    pdf.setFont(subTextFontName, subTextFontWeight);
                    if (rightParent.name) {
                        pdf.text(`Name: ${truncateText(rightParent.name, 40)}`, rightColX + 5, rightY);
                        rightY += 5;
                    }
                    if (rightParent.email) {
                        pdf.text(`Email: ${truncateText(rightParent.email, 35)}`, rightColX + 5, rightY);
                        rightY += 5;
                    }
                    if (rightParent.phone_number) {
                        pdf.text(`Phone: ${truncateText(rightParent.phone_number, 35)}`, rightColX + 5, rightY);
                        rightY += 5;
                    }
                }
                
                yPosition = Math.max(leftY, rightY) + 8;
            }
            yPosition += 5;
        }
        
        if (detailedData?.students && detailedData.students.length > 0) {
            yPosition = checkPageBreak(yPosition, 40);
            
            pdf.setFont(titleFontName, titleFontWeight);
            pdf.setFontSize(16);
            pdf.text('Student Information', margin, yPosition);
            yPosition += 15;
            
            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.setFontSize(11);
            
            const columnWidth = contentWidth / 2 - 10;
            const leftColX = margin;
            const rightColX = margin + columnWidth + 20;
            
            for (let i = 0; i < detailedData.students.length; i += 2) {
                yPosition = checkPageBreak(yPosition, 35);
                
                const leftStudent = detailedData.students[i];
                const rightStudent = detailedData.students[i + 1];
                
                let leftY = yPosition;
                let rightY = yPosition;
                
                pdf.setFont(textFontName, textFontWeight);
                pdf.text(`Student ${i + 1}:`, leftColX, leftY);
                leftY += 6;
                
                pdf.setFont(subTextFontName, subTextFontWeight);
                if (leftStudent.name) {
                    pdf.text(`Name: ${truncateText(leftStudent.name, 40)}`, leftColX + 5, leftY);
                    leftY += 5;
                }
                if (leftStudent.grade) {
                    pdf.text(`Grade: ${truncateText(leftStudent.grade, 40)}`, leftColX + 5, leftY);
                    leftY += 5;
                }
                if (leftStudent.school_division) {
                    pdf.text(`School Division: ${truncateText(leftStudent.school_division, 30)}`, leftColX + 5, leftY);
                    leftY += 5;
                }
                
                if (rightStudent) {
                    pdf.setFont(textFontName, textFontWeight);
                    pdf.text(`Student ${i + 2}:`, rightColX, rightY);
                    rightY += 6;
                    
                    pdf.setFont(subTextFontName, subTextFontWeight);
                    
                    if (rightStudent.name) {
                        pdf.text(`Name: ${truncateText(rightStudent.name, 40)}`, rightColX + 5, rightY);
                        rightY += 5;
                    }
                    
                    if (rightStudent.grade) {
                        pdf.text(`Grade: ${truncateText(rightStudent.grade, 40)}`, rightColX + 5, rightY);
                        rightY += 5;
                    }
                    
                    if (rightStudent.school_division) {
                        pdf.text(`School Division: ${truncateText(rightStudent.school_division, 30)}`, rightColX + 5, rightY);
                        rightY += 5;
                    }
                }
                
                yPosition = Math.max(leftY, rightY) + 8;
            }
            yPosition += 5;
        }
        
        addFooter();
        pdf.addPage();
        yPosition = margin;
        
        if (detailedData?.extras) {
            pdf.setFont(titleFontName, titleFontWeight);
            pdf.setFontSize(16);
            pdf.text('Extras Information', margin, yPosition);
            yPosition += 15;
            
            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.setFontSize(11);
            
            if (detailedData.extras.payment_status) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Payment Status:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                pdf.text(truncateText(detailedData.extras.payment_status), margin + 35, yPosition);
                yPosition += 6;
            }
            
            if (detailedData.extras.additional_attendees >= 0) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Additional Attendees:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                const attendeeText = detailedData.extras.additional_attendees == 0 ? 'No' : detailedData.extras.additional_attendees.toString();
                pdf.text(attendeeText, margin + 45, yPosition);
                yPosition += 6;
            }
            
            if (detailedData.extras.cd_count >= 0) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('After Party CDs:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                const cdText = detailedData.extras.cd_count == 0 ? 'No' : detailedData.extras.cd_count.toString();
                pdf.text(cdText, margin + 35, yPosition);
                yPosition += 6;
            }
            
            const totalCost = (detailedData.extras.cd_count * cdCost) + (detailedData.extras.additional_attendees * additionalAttendeeCost);
            
            if (totalCost > 0) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Total Extras Cost:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                pdf.text(`${totalCost} EGP`, margin + 37, yPosition);
                yPosition += 6;
            }
            
            if (detailedData.extras.updated_at) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Last Updated:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                const dateStr = formatDateFromPacific(detailedData.extras.updated_at);
                pdf.text(truncateText(dateStr), margin + 30, yPosition);
                yPosition += 6;
            }
            
            yPosition += 20;
        }
        
        
        if (detailedData?.booking) {
            pdf.setFont(titleFontName, titleFontWeight);
            pdf.setFontSize(16);
            pdf.text('Total Amounts', margin, yPosition);
            yPosition += 15;
            
            pdf.setFont(subTextFontName, subTextFontWeight);
            pdf.setFontSize(11);
            
            const totalPaidForBaseFare = detailedData.booking.total_paid_for_base_fair
            const totalCostOfExtras =  detailedData.booking.total_extras_cost
            const totalCostOfBaseFareAndExtras = detailedData.booking.total_paid_for_base_and_extras
            
            if (totalPaidForBaseFare) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Total Paid For Base Fare:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                pdf.text(totalPaidForBaseFare, margin + 55, yPosition);
                yPosition += 6;
            }
            
            if (totalCostOfExtras) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Total Cost For Extras:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                pdf.text(totalCostOfExtras, margin + 45, yPosition);
                yPosition += 6;
            }
            
            if (totalCostOfBaseFareAndExtras) {
                pdf.setFont(textFontName, textFontWeight);
                pdf.text('Total Cost For Base Fare and Extras:', margin, yPosition);
                pdf.setFont(subTextFontName, subTextFontWeight);
                pdf.text(totalCostOfBaseFareAndExtras, margin + 75, yPosition);
                yPosition += 6;
            }
            
        }
        
        yPosition += 30;
        
        try {
            const qrData = `https://harvestschools.com/events/booking-confirmation/?bookingId=${bookingId}&extrasId=${detailedData?.extras?.extra_id || ''}&authId=${detailedData?.booking?.password_hash || ''}&username=${bookingUsername}`;
            const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                width: 300,
                margin: 2,
                errorCorrectionLevel: 'M'
            });
            
            const qrSize = 60;
            const qrX = (pageWidth - qrSize) / 2;
            pdf.addImage(qrCodeDataURL, 'PNG', qrX, yPosition, qrSize, qrSize);
        } catch (qrError) {
            console.warn('Could not generate QR code:', qrError);
            pdf.setFont(textFontName, textFontWeight);
            pdf.setFontSize(10);
            pdf.text('QR Code generation failed', pageWidth / 2, yPosition, { align: 'center' });
        }
        
        addFooter();
        
        const filename = `booking-confirmation-${bookingId}.pdf`;
        
        if (action === 'download') {
            try {
                

                
                if (isIOS) {
                    const pdfBlob = pdf.output('blob');
                    
                    if (navigator.share) {
                        navigator.share({
                            files: [new File([pdfBlob], filename, { type: 'application/pdf' })],
                            title: 'Booking Confirmation'
                        }).catch(console.error);
                    } else {
                        const pdfBlob = pdf.output('blob');
                        const pdfUrl = URL.createObjectURL(pdfBlob);
                        const link = document.createElement('a');
                        link.href = pdfUrl;
                        link.download = filename;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        pdf.save(filename);
                    }
                } else if (isMobile) {
                    const pdfBlob = pdf.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = filename;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    pdf.save(filename);
                } else {
                    const pdfBlob = pdf.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    window.open(pdfUrl, "_blank");
                    pdf.save(filename);
                }
            } catch (downloadError) {
                console.warn('Download failed, opening in new tab:', downloadError);
                const pdfBlob = pdf.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);
                window.open(pdfUrl, '_blank');
            }
        } else if (action === 'print') {
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, "_blank");
        }
        
        
        
    } catch (error) {
        console.error('Error generating PDF:', error.message || error || 'Unknown error');
        setError(`Error generating PDF: ${error.message || error || 'Unknown error'}`);
        setTimeout(() => {setError(null);}, msgTimeout);
    } finally {
        setIsLoading(false);
    }
};

const cdCost = 250;
const additionalAttendeeCost = 100;
const pendingPaymentStatus = 'Signed Up, pending payment';
const notSignedUpStatus = 'Not Signed Up';
const confirmedStatus = 'Confirmed';

export {
    checkAdminSession,
    checkBookingSession,
    sessionDuration,
    sessionDurationInHours,
    msgTimeout,
    getCookies,
    formatDateFromPacific,
    useFormCache,
    checkAdminSessionFromAdminLogin,
    validateAdminLogin,
    checkAdminSessionFromAdminDashboard,
    checkBookingSessionFromBookingLogin,
    validateBookingLogin,
    handleAddBookingRequest,
    checkBookingSessionFromBookingDashboard,
    handleDeleteBookingRequest,
    fetchBookingsRequest,
    validateAdminSessionLocally,
    validateBookingSessionLocally,
    createSessions,
    extendSession,
    resetSession,
    bookingLoginPageUrl,
    bookingDashboardPageUrl,
    adminLoginPageUrl,
    adminDashboardPageUrl,
    headToAdminLoginOnInvalidSession,
    headToBookingLoginOnInvalidSession,
    headToAdminLoginOnInvalidSessionFromAdminDashboard,
    headToBookingLoginOnInvalidSessionFromBookingDashboard,
    headToAdminDashboardOnValidSession,
    headToBookingDashboardOnValidSession,
    fetchJobApplicationsRequest,
    submitFormRequest,
    submitJobApplicationRequest,
    fetchBookingInfoBySessionRequest,
    handleEditBookingRequest,
    submitUpdateBookingExtrasRequest,
    fetchBookingConfirmationRequest,
    generateConfirmationPDF,
    cdCost,
    additionalAttendeeCost,
    pendingPaymentStatus,
    notSignedUpStatus,
    confirmedStatus
};
