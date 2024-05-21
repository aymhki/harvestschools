import FullPageOptionsSelector from "../../../modules/FullPageOptionsSelector.jsx";

function Covid19English() {
    const left = {
        text: "Read",
        link: "/covid-19/covid-19-english-read",
        inArabic: false,
        isAssetLink: false
    };
    const right = {
        text: "Download",
        link: "/assets/documents/Covid-19/Covid-19_Parents_Guide.pdf",
        inArabic: false,
        isAssetLink: true
    };

    const options = [left, right];

    return (
        <FullPageOptionsSelector options={options} />
    );
}

export default Covid19English;