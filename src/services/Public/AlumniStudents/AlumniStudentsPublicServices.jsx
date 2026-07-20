import {endpoints} from "../../General/GeneralUtils.jsx";

const fetchApprovedAlumniPosts = async (placement, limit = 0) => {
    try {
        const params = new URLSearchParams();
        params.set('placement', placement);

        if (limit > 0) {
            params.set('limit', String(limit));
        }

        const response = await fetch(`${endpoints.getApprovedAlumniPosts}?${params.toString()}`, {method: 'GET'});
        const result = await response.json();

        if (result && result.success && Array.isArray(result.posts)) {
            return result.posts;
        }

        if (result && result.message) {
            console.log(result.message);
        }

        return [];
    } catch (error) {
        console.log(error.message);
        return [];
    }
}

export {
    fetchApprovedAlumniPosts
}
