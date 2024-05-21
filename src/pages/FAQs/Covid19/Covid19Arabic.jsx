import FullPageOptionsSelector from "../../../modules/FullPageOptionsSelector.jsx";

function Covid19Arabic() {
    const left = {
        text: "قراءة",
        link: "/covid-19/covid-19-arabic-read",
        inArabic: true,
        isAssetLink: false
    };
    const right = {
        text: "تنزيل",
        link: "/assets/documents/Covid-19/Covid-19_Parent_Guide_(Arabic).pdf",
        inArabic: true,
        isAssetLink: true
    };

    const options = [left, right];

    return (
        <FullPageOptionsSelector options={options} />
    );
}

export default Covid19Arabic;