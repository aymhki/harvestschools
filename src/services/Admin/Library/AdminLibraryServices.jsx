import {validateAdminSessionLocally} from "../Session/MainAdminServices.jsx";
import {adminLoginPageUrl, endpoints, buildAuthHeaders} from "../../General/GeneralUtils.jsx";


const fetchLibraryBooks = async (navigate, setCollections, setCategories) => {
    const sessionId = await validateAdminSessionLocally();

    if (!sessionId) {
        navigate(adminLoginPageUrl, { replace: true });
        return;
    }

    try {
        const response = await fetch(endpoints.getLibraryBooks, {method: 'GET',
            headers: await buildAuthHeaders(sessionId)
        });

        const result = await response.json();

        if (result && result.success && result.data) {
            setCollections(result.data.collections || []);
            setCategories(result.data.categories || []);
            return;
        }

        if (result && result.message) {
            console.log(result.message);
        }

        if (result && result.code && (result.code === 401 || result.code === 403)) {
            navigate(adminLoginPageUrl, { replace: true });
        }
    } catch (error) {
        console.log(error.message);
    }
}


const postToLibrary = async (endpoint, payload, fallbackMessage) => {
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


const addLibraryBook = async (book) =>
    postToLibrary(endpoints.addLibraryBook, book, 'An error occurred while adding the book.');

const editLibraryBook = async (book) =>
    postToLibrary(endpoints.editLibraryBook, book, 'An error occurred while editing the book.');

const deleteLibraryBook = async (bookId) =>
    postToLibrary(endpoints.deleteLibraryBook, { book_id: bookId }, 'An error occurred while deleting the book.');


const deleteLibraryBooks = async (scope, categoryKey) =>
    postToLibrary(
        endpoints.deleteLibraryBooks,
        { scope: scope, category_key: categoryKey || '' },
        'An error occurred while deleting the books.'
    );


export {
    fetchLibraryBooks,
    addLibraryBook,
    editLibraryBook,
    deleteLibraryBook,
    deleteLibraryBooks
}
